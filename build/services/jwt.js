"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = "$anti@2003";
class jwtService {
    static generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
        return token;
    }
    ;
    static decodeToken(token) {
        try {
            const user = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            return user;
        }
        catch (error) {
            console.log("error in decode toekn: ", error);
            return null;
        }
    }
}
exports.default = jwtService;
