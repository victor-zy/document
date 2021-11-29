const getActivityGroupLQC = require('./lc/example.activity-group.js');

const lqc = getActivityGroupLQC(groupId, type);
const total = lqc.cout();
console.log(total);
