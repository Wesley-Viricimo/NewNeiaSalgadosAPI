import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io'; // Import Socket for type definition
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { NotificationGatewayDto } from './dto/notifications.gateway.dto';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    private connectedUsers: Map<string, string> = new Map();

    constructor(private readonly prismaService: PrismaService) { }

    async handleConnection(socket: Socket) {
        const userId = socket.handshake.query.userId as string;
        
        if (!userId) {
            socket.disconnect();
            return;
        }

        console.log('Connected:', socket.id);
        console.log('DeskId(Connection):', userId);
        socket.emit('socket-id', socket.id);

        const user = await this.prismaService.user.findUnique({
            where: { idUser: Number(userId) },
        });

        if (user && ['DEV', 'ADMIN', 'COMERCIAL'].includes(user.role)) {
            this.connectedUsers.set(socket.id, userId);
            socket.join(user.role.toLowerCase())
            console.log(`User ${user.name} ID ${userId} connected with role ${user.role}`);
        } else {
            socket.disconnect();
            console.log(`Connection rejected for user ${userId}`);
        }
    }

    handleDisconnect(socket: Socket) {
        const userId = socket.handshake.query.userId as string;
        console.log('Disconnected:', socket.id);
        console.log('DeskId(Disconnection):', userId);

        if (userId) {
            this.connectedUsers.delete(socket.id); // Remove user from the map
            socket.leave(userId);
            console.log(`User ${userId} disconnected`);
        }
    }

    @SubscribeMessage('response-query')
    async listen(@MessageBody() notification: NotificationGatewayDto) {
        // Emit the notification to all role-based rooms
        const roles = ['dev', 'admin', 'comercial'];
        for (const role of roles) {
            this.server.to(role).emit('response-query', notification);
        }
    }
}