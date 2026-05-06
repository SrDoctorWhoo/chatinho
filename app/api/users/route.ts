import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

import { hash } from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Hierarquia: ADMIN > MANAGER > ATTENDANT
    // Gerentes não veem usuários com permissão superior (ADMIN)
    const roleFilter: any = {};
    if (session.user.role === 'MANAGER') {
      roleFilter.role = { in: ['MANAGER', 'ATTENDANT'] };
    } else if (session.user.role === 'ATTENDANT') {
      roleFilter.role = 'ATTENDANT';
    }

    const users = await prisma.user.findMany({
      where: roleFilter,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        signature: true,
        createdAt: true,
        departments: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { name, email, password, role, departmentIds, signature } = await req.json();

    // Segurança: Apenas ADMIN pode criar outro ADMIN ou MANAGER
    let targetRole = role || 'ATTENDANT';
    if ((targetRole === 'ADMIN' || targetRole === 'MANAGER') && session.user.role !== 'ADMIN') {
      targetRole = 'ATTENDANT';
    }

    // Segurança: Gerente só pode vincular usuários a setores que ele mesmo gerencia
    let finalDeptIds = departmentIds;
    if (session.user.role === 'MANAGER') {
      const myDeptIds = (session.user as any).departmentIds || [];
      finalDeptIds = departmentIds?.filter((id: string) => myDeptIds.includes(id)) || [];
      
      // Se um gerente tentou criar sem setor ou em setor proibido, forçamos um dos setores dele
      if ((!finalDeptIds || finalDeptIds.length === 0) && myDeptIds.length > 0) {
        finalDeptIds = [myDeptIds[0]];
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: targetRole,
        signature,
        departments: finalDeptIds ? {
          connect: finalDeptIds.map((id: string) => ({ id }))
        } : undefined
      }
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}
