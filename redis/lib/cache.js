const _ = require('lodash');
const assert = require('assert');

/**
 * list cache
 */
class LC {
  constructor(redis, key, options = {}) {
    this.redis = redis;
    this.key = key;
    this.stdTTL = options.stdTTL || -1;
  }

  /**
   * reset or redefine the ttl of a key. `ttl` = -1 means infinite lifetime.
   *
   * @param {integer} ttl
   * @return {integer} ttl in seconds
   * @memberof LC
   */
  async ttl(ttl) {
    ttl = ttl || this.stdTTL;
    if (ttl === -1) {
      return await this.redis.persist(this.key);
    }
    await this.redis.expire(this.key, ttl);
  }

  /**
   *
   * receive the ttl of a key.
   * @return {integer} ttl in seconds
   * @memberof LC
   */
  async getTTL() {
    return await this.redis.ttl(this.key);
  }

  /**
   * empty key
   * @memberof LC
   */
  async del() {
    await this.redis.del(this.key);
  }

  /**
   * add specified members with the specified scores
   *
   * @param {array<[member, score]>} args the collection of score and member
   * @memberof LC
   */
  async add(...args) {
    if (!args.length) {
      return;
    }

    for (const [, score] of args) {
      assert(typeof score === 'number', 'score 必须是数字类型');
    }
    args = _.flatten(args);
    args = _.reverse(args);
    const ttl = await this.getTTL();

    await this.redis.zadd(this.key, args);
    this.redis.zadd(this.key, ['-inf', 'NEGATIVE_INFINITY', '+inf', 'POSITIVE_INFINITY']);
    if (ttl > 0 || this.stdTTL > 0) {
      this.redis.expire(this.key, ttl > 0 ? ttl : this.stdTTL);
    }
  }

  /**
   * remove members
   * @param {...string} members collection of members
   */
  async rem(...members) {
    if (!members.length) {
      return;
    }

    this.redis.zadd(this.key, ['-inf', 'NEGATIVE_INFINITY', '+inf', 'POSITIVE_INFINITY']);
    this.redis.zrem(this.key, members);
  }

  /**
   * Removes and returns up to count members with the highest scores in the sorted set stored at key.
   * @param {integer} count
   */
  async popMax(count = 1) {
    if (count < 1) {
      return;
    }
    const drops = await this.rangeByScore({
      limit: count,
      order: 'desc',
    });

    const members = drops.map(value => value[0]);
    await this.rem.apply(this, members);

    return drops;
  }

  /**
   * Removes and returns up to count members with the lowest scores in the sorted set stored at key.
   * @param {integer} count
   */
  async popMin(count = 1) {
    if (count < 1) {
      return;
    }
    const drops = await this.rangeByScore({
      limit: count,
      order: 'asc',
    });

    const members = drops.map(value => value[0]);
    await this.rem.apply(this, members);

    return drops;
  }

  /**
   * @link https://redis.io/commands/zrangebyscore
   * Returns all the elements in the sorted set at key with a score between min and max
   *
   * @param {object} options
   * @param {string} [options.order='asc', order='desc'] 排序方式， 默认是 asc
   * @param {string} [options.start]
   * @param {string} [options.end]
   * @param {number} [options.offset]
   * @param {number} [options.limit]
   * @return {array<[member, score]>}
   * @memberof LC
   */
  async rangeByScore(options) {
    let result = [];
    options = _.defaults(options, {
      offset: 0,
      limit: -1,
      order: 'desc',
      start: Number.MIN_SAFE_INTEGER,
      end: Number.MAX_SAFE_INTEGER,
    });
    switch (options.order) {
      case 'desc':
        // eslint-disable-next-line no-case-declarations
        const tmp = options.start;
        options.start = options.end;
        options.end = tmp;
        // eslint-disable-next-line
        result = await this.redis.zrevrangebyscore(this.key, options.start, options.end, 'withscores', 'limit', options.offset, options.limit);
        break;
      case 'asc':
      default:
        // eslint-disable-next-line
        result = await this.redis.zrangebyscore(this.key, options.start, options.end, 'withscores', 'limit', options.offset, options.limit);
        break;
    }

    return _.chunk(result, 2).map(([member, score]) => {
      return [member, Number(score)];
    });
  }

  /**
   * Returns the number of elements in the sorted set at key with a score between min and max.
   *
   * @param {number} minScore default is Number.MIN_SAFE_INTEGER
   * @param {number} maxScore default is Number.MAX_SAFE_INTEGER
   * @return {integer}
   * @memberof LC
   */
  async count(minScore, maxScore) {
    minScore = minScore ?? Number.MIN_SAFE_INTEGER;
    maxScore = maxScore ?? Number.MAX_SAFE_INTEGER;
    return await this.redis.zcount(this.key, minScore, maxScore);
  }

  /**
   * Return the number of elements in the sorted set
   * @returns {Promise<|number>}
   */
  async card() {
    const len = await this.redis.zcard(this.key);

    return len || 0;
  }

  /**
   * Returns the score of member in the sorted set at key.
   *
   * @param {string} member
   * @return {number} score
   * @memberof LC
   */
  async getScoreByMember(member) {
    const score = await this.redis.zscore(this.key, member);
    if (score) {
      return Number(score);
    }
  }
}

module.exports = LC;

