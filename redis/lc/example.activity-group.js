const ms = require('ms');
const ruo = require('ruo');
const _ = require('lodash');
const assert = require('assert');

const ListQueryCache = require('../lib/lc');

class ActivityGroupLQC extends ListQueryCache {
  constructor(options) {
    assert(options.where?.groupId, 'where.groupId is required');
    assert(_.isSafeInteger(options.where.groupId), 'where.groupId must be a safe integer');
    super({
      model: 'Activity',
      memberColumn: 'id',
      scoreColumn: 'createdAt',
      stdTTL: ms('24h') / 1000,
      order: 'desc',
      ...options,
    });
    this.groupId = this.where.groupId;
  }

  async build() {
    let results = await ruo.models[this.model].findAll({
      attributes: [this.memberColumn],
      where: this.where,
      order: [[this.scoreColumn, this.order]],
      offset: 0,
      limit: this.maxMembers,
    });
    results = await Promise.all(results.map(async result => {
      const member = result[this.memberColumn];
      result = await ruo.models[this.model].cache().findByPk(member);

      return [member, result[this.scoreColumn].valueOf()];
    }));

    await this.add.apply(this, results);
  }

  async convert(result = []) {
    const [member] = result;
    const instance = await ruo.models[this.model].cache().findByPk(member);
    if (!instance || instance.status === 'deleted' || instance.groupId !== this.groupId) {
      await this.remove(member);

      return;
    }
    if (this.where.type && this.where.type !== instance.type) {
      await this.remove(member);

      return;
    }

    return instance;
  }
}

module.exports = function (groupId, type) {
  groupId = Number(groupId);
  if (!groupId || groupId === -1) { return; }
  const where = {
    groupId,
    // 不能使用 sequelize.Op, 否则会造成各个实例的 key 不一致
    status: ['enabled', 'disabled', 'forbidden'],
  };
  if (type) { where.type = type; }
  return new ActivityGroupLQC({where});
};

