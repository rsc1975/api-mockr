"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_yaml_1 = __importDefault(require("js-yaml"));
const fs_1 = require("fs");
const doc = js_yaml_1.default.load((0, fs_1.readFileSync)('./config/response.yml', 'utf8'));
console.log(js_yaml_1.default.dump(doc, { indent: 2 }));
