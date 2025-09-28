import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Notification } from '@prisma/client';
import { RolesHelper } from 'src/shared/utils/helpers/roles.helper';
import { TokenDecoderService } from 'src/auth/token/token-decoder.service';
import { Logger, OnApplicationShutdown } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, OnApplicationShutdown {
    private readonly logger = new Logger(NotificationsGateway.name);
    @WebSocketServer() server: Server;

    private connectedUsers: Map<string, string> = new Map();

    constructor(
        private readonly prismaService: PrismaService,
        private readonly tokenDecoder: TokenDecoderService
    ) { }

    afterInit(server: Server) {
        this.logger.debug('WebSocket Gateway initialized');
    }

    async onApplicationShutdown(signal?: string) {
        this.logger.debug(`Application is shutting down... Signal: ${signal}`);

        const roles = [RolesHelper.ADMIN, RolesHelper.DEV, RolesHelper.COMERCIAL];
        
        for (const role of roles) {
            this.server.to(role).emit('disconnect-socket-id', { 
                message: 'Server is shutting down', 
                reason: 'server_shutdown',
                timestamp: new Date().toISOString()
            });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.server.disconnectSockets();        
        this.logger.debug('All users disconnected due to server shutdown');
    }

    async handleConnection(socket: Socket) {
        try {
            const token = socket.handshake.headers.authorization as string;
            
            if (!token) {
                socket.disconnect();
                return;
            }
            
            const payload = this.tokenDecoder.decodeToken(token);
            const userId = payload.idUser.toString();

            const user = await this.prismaService.user.findUnique({
                where: { idUser: payload.idUser },
            });

            if (!user.isActive) {
                this.logger.error(`User ${userId} inactive not allowed to connect`);
                socket.disconnect();
                return;
            }

            const validRoles = [RolesHelper.ADMIN, RolesHelper.DEV, RolesHelper.COMERCIAL].map(role => role.toString());
            if (!validRoles.includes(user.role)) {
                this.logger.error(`Connection rejected for user ${userId} - invalid role: ${user.role}`);
                socket.disconnect();
                return;
            }

            this.connectedUsers.set(socket.id, userId);
            socket.join(user.role);

            socket.emit('connect-socket-id', socket.id);
            this.logger.debug(`User ${user.name} ID ${userId} connected with role ${user.role}`);

        } catch (error) {
            this.logger.error('Authentication failed:', error.message);
            socket.emit('authentication-error', { message: 'Invalid token' });
            socket.disconnect();
        }
    }

    handleDisconnect(socket: Socket) {        
        const userId = this.connectedUsers.get(socket.id);
        if (userId) {
            this.connectedUsers.delete(socket.id);
            this.logger.debug(`User ${userId} disconnected`);
        }
    }

    emitToAllRoles(event: string, notification: Notification) {
        const roles = [RolesHelper.ADMIN, RolesHelper.DEV, RolesHelper.COMERCIAL];
        for (const role of roles) {
            this.server.to(role).emit(event, notification);
        }
    }
}