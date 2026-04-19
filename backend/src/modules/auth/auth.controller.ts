import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { SESSION_COOKIE } from "@backend/common/constants/app.constants";
import { CurrentUser } from "@backend/common/auth/current-user.decorator";
import { JwtAuthGuard } from "@backend/common/auth/jwt-auth.guard";
import { Public } from "@backend/common/auth/public.decorator";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { getCookieSecure } from "@backend/common/config/runtime-options";
import { signSessionToken } from "@backend/common/auth/session-token.server";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.login(dto);
    const token = await signSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: getCookieSecure(),
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
      },
    };
  }

  @Public()
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.register(dto);
    const token = await signSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: getCookieSecure(),
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      sameSite: "lax",
      secure: getCookieSecure(),
      path: "/",
    });

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser() user: RequestUser | null) {
    return { success: true, user };
  }
}
