"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const queries_1 = require("./queries");
const resolvers_1 = require("./resolvers");
const mutations_1 = require("./mutations");
const types_1 = require("./types");
exports.User = { types: types_1.types, resolvers: resolvers_1.resolvers, queries: queries_1.queries, mutations: mutations_1.mutations };
