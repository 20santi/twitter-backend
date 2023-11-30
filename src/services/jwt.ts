import { User } from "@prisma/client";
import JWT from "jsonwebtoken";
import { jwtUser } from "../interfaces";

const JWT_SECRET = "$anti@2003";

class jwtService {
    public static generateToken(user: User) {
        const payload: jwtUser = {
            id: user.id,
            email: user.email,
            role: user.role
        }

        const token = JWT.sign(payload, JWT_SECRET);
        return token;
    };

    public static decodeToken(token: string) {
        try{
            const user = JWT.verify(token, JWT_SECRET) as jwtUser
            return user;
        } catch(error) {
            console.log("error in decode toekn: ", error);
            return null;
        }
    }
}

export default jwtService;