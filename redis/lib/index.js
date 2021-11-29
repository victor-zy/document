const ruo = require('ruo');
const _ = require('lodash');

const LC = require('./cache');
const utility = require('../utility');
const redis = require('../redis')('cluster');

module.exports = class ListQueryCache extends LC {
  /**
   * Creates an instance of ListCache
   * @param {object} [options]
   * @param {object} [options.model] sequelize model 实例
   * @param {object} [options.where] sequelize where 查询条件
   * @param {string} [options.memberColumn] model 实例中作为列表元素的唯一标识，默认为 id
   * @param {string} [options.scoreColumn] 列表中用于排序的字段，默认为 id
   * @param {string} [options.order] 排序方向，用于指定 findAll 出来的结果的排序方向, 默认为 asc
   * @param {integer} [options.stdTTL] 列表最大生存周期，单位为秒，默认是不过期
   * @param {string} [options.maxMembers] 列表最大长度，默认为 Number.MAX_SAFE_INTEGER
   */
  constructor(options) {
    const key = `model:list:query:cache:${options.model}:${utility.md5(options)}`;
    super(redis, key, {
      stdTTL: options.stdTTL,
    });

    this.where = options.where;
    this.model = options.model;
    this.memberColumn = options.memberColumn || 'id';
    this.scoreColumn = options.scoreColumn || 'id';
    this.order = options.order || 'asc';
    this.maxMembers = options.maxMembers || Number.MAX_SAFE_INTEGER;
  }

  static getCache(options) {
    return new ListQueryCache(options);
  }

  /**
   * add specified members with the specified scores
   *
   * @param {Object} instance
   * @memberof ListQueryCache
   */
  async insert(instance) {
    await this._build(); // 防止缓存过期
    if (!instance) { return; }

    const member = instance[this.memberColumn];
    let score = instance[this.scoreColumn];
    if (_.isDate(score)) {
      score = score.getTime();
    }

    await this.add([member, score]);
    const len = await this.count();
    if (len > this.maxMembers) {
      this.order === 'desc' ?
        await this.popMin(len - this.maxMembers) :
        await this.popMax(len - this.maxMembers);
    }
  }

  /**
   *
   * remove specified member from list cache
   *
   * @param {*} instance
   * @memberof ListQueryCache
   */
  async remove(member) {
    member = _.get(member, this.memberColumn) || member;
    if (!member) { return; }

    await this.rem(member);
  }

  async build() {
    let result = await ruo.models[this.model].findAll({
      attributes: _.uniq(['id', this.memberColumn, this.scoreColumn]),
      where: this.where,
      order: [[this.scoreColumn, this.order]],
      offset: 0,
      limit: this.maxMembers,
    });
    result = result.map(val => {
      let score = val[this.scoreColumn];
      if (_.isDate(score)) {
        score = score.getTime();
      }
      return [val[this.memberColumn], score];
    });

    await this.add.apply(this, result);
  }

  /**
   * @returns {Promise<void>}
   * @private
   */
  async _build() {
    const len = await this.card();
    if (len) { return; }

    await this.build();
  }

  async rebuild() {
    await this.del();
    await this._build();
  }

  /**
   * 将列表缓存中的值转为 instance 实例
   * @param {Array} result
   * @returns {Promise<Object>}
   */
  async convert(result = []) {
    const [member] = result;
    const instance = await ruo.models[this.model].cache().findByPk(member);
    if (!instance) {
      await this.remove(member);

      return null;
    }

    return instance;
  }

  async findAll(criteria = {}) {
    await this._build();

    if (criteria.limit === 0) {
      return [];
    }
    let results = [];
    if (_.has(criteria, 'offset')) {
      results = await this.rangeByScore({
        offset: criteria.offset,
        limit: criteria.limit || this.maxMembers,
        order: this.order,
      });
    } else if (_.has(criteria, 'since')) {
      results = await this.rangeByScore({
        start: '(' + criteria.since,
        limit: criteria.limit || this.maxMembers,
        order: this.order,
      });
    } else if (_.has(criteria, 'max')) {
      results = await this.rangeByScore({
        limit: criteria.limit || this.maxMembers,
        end: '(' + criteria.max,
        order: this.order,
      });
    } else {
      console.warn('list cache findAll 方法必须传递 offset, since 或 max 参数'); // eslint-disable-line no-console
    }

    return await Promise.all(results.map(async result => {
      if (_.isEmpty(result)) {
        return null;
      }
      return await this.convert(result);
    })).then(values => {
      return values.filter(v => v);
    });
  }
};

