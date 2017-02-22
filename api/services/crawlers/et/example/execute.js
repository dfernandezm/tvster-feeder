// Initialize
require('ts-node').register({ /* options */ });

// Get functions.ts
var funcs = require("./funcs.ts");
console.log(funcs.lowercase("HELLO!"));