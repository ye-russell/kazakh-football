import { Controller, Post, Get, Body, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered and token returned' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Token returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns the logged-in user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: { userId: string }) {
    return this.authService.getProfile(user.userId);
  }
}
