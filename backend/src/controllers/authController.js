import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.js';
import { isMongoActive } from '../config/mongodb.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    let user = null;

    if (isMongoActive()) {
      user = await Usuario.findOne({ email: email.toLowerCase().trim() });
    }

    // Modo local / Fallback para desarrollo sin DB conectada
    if (!user && email === 'admin@smartinventory.com' && password === 'Admin2026*!') {
      user = {
        id: 'USR-DEV-001',
        nombre: 'Administrador Demo',
        email: 'admin@smartinventory.com',
        rol: 'ADMINISTRADOR',
        passwordHash: bcrypt.hashSync('Admin2026*!', 10)
      };
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPass = await bcrypt.compare(password, user.passwordHash);
    if (!validPass) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const secret = process.env.JWT_SECRET || 'dev_secret_jwt';
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
      secret,
      { expiresIn: '8h' }
    );

    return res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    next(error);
  }
}

export function me(req, res) {
  return res.json({ user: req.user });
}
