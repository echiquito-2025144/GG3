import { pool } from '../../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  static async login(email: string, passwordPlana: string) {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      throw new Error('Credenciales incorrectas');
    }

    const usuario = result.rows[0];

    const esValida = await bcrypt.compare(passwordPlana, usuario.password);
    if (!esValida) {
      throw new Error('Credenciales incorrectas');
    }

    const secret = process.env.JWT_SECRET || 'secret';

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      secret,
      { expiresIn: '2m' } // Expira en 2 minutos
    );

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        foto: usuario.foto || '' // Devuelve la foto de la BD
      }
    };
  }

  static async register(nombre: string, email: string, passwordPlana: string) {
    const usuarioExistente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (usuarioExistente.rows.length > 0) {
      throw new Error('El correo electrónico ya está registrado');
    }

    const saltRounds = 10;
    const passwordEncriptada = await bcrypt.hash(passwordPlana, saltRounds);

    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, foto) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, email, rol, foto',
      [nombre, email, passwordEncriptada, 'USUARIO', '']
    );

    const nuevoUsuario = result.rows[0];

    const secret = process.env.JWT_SECRET || 'secret';

    const token = jwt.sign(
      { id: nuevoUsuario.id, email: nuevoUsuario.email, rol: nuevoUsuario.rol },
      secret,
      { expiresIn: '2m' } // Expira en 2 minutos
    );

    return {
      token,
      usuario: {
        ...nuevoUsuario,
        foto: nuevoUsuario.foto || ''
      }
    };
  }

  // Método para actualizar y persistir la foto en la BD
  static async actualizarFoto(email: string, foto: string) {
    const result = await pool.query(
      'UPDATE usuarios SET foto = $1 WHERE email = $2 RETURNING id, nombre, email, rol, foto',
      [foto, email]
    );

    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    return result.rows[0];
  }
}