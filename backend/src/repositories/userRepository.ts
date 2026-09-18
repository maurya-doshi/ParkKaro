import { BaseRepository } from './baseRepository';
import { User, UserRole } from '../models/User';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async create(user: User): Promise<User> {
    return this.putItem(user);
  }

  async findById(userId: string): Promise<User | null> {
    return this.getItem({ userId });
  }

  async findByEmail(email: string): Promise<User | null> {
    const items = await this.queryItems({
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });
    return items[0] || null;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.queryItems({
      IndexName: 'role-index',
      KeyConditionExpression: '#role = :role',
      ExpressionAttributeNames: {
        '#role': 'role',
      },
      ExpressionAttributeValues: {
        ':role': role,
      },
    });
  }

  async update(userId: string, data: Partial<User>): Promise<User | null> {
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString(),
    };

    if (data.name !== undefined) {
      updateExpressions.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = data.name;
    }
    if (data.phone !== undefined) {
      updateExpressions.push('#phone = :phone');
      expressionAttributeNames['#phone'] = 'phone';
      expressionAttributeValues[':phone'] = data.phone;
    }
    if (data.role !== undefined) {
      updateExpressions.push('#role = :role');
      expressionAttributeNames['#role'] = 'role';
      expressionAttributeValues[':role'] = data.role;
    }
    if (data.profileImage !== undefined) {
      updateExpressions.push('#profileImage = :profileImage');
      expressionAttributeNames['#profileImage'] = 'profileImage';
      expressionAttributeValues[':profileImage'] = data.profileImage;
    }
    if (data.status !== undefined) {
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = data.status;
    }

    return this.updateItem(
      { userId },
      `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues
    );
  }

  async list(limit = 50): Promise<User[]> {
    return this.scanItems({ Limit: limit });
  }
}

export const userRepository = new UserRepository();
