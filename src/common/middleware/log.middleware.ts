import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction } from "express"; // middleware는 express에서 가져온 기능

@Injectable()
export class LogMiddleware implements NestMiddleware {

     use(req: Request, res: Response, next: NextFunction) {
         console.log(`[REQ] ${req.method} ${req.url} ${new Date().toLocaleString('kr')}`);
         next();
     }
} 