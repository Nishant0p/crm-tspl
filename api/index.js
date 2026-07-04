import pg from 'pg'
import crypto from 'crypto'

const { Pool } = pg

// Setup PostgreSQL pool (reuse across invocations)
let pool
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5
    })
  }
  return pool
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Mailer: Send Mail via Resend REST API
async function sendMailViaResend(email, subject, htmlContent) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) return false
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TSPL Platform <noreply@tspl.nishant.codes>',
        to: [email],
        subject: subject,
        html: htmlContent
      })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Resend delivery failure')
    console.log(`◇ Email dispatched to ${email} (ID: ${data.id})`)
    return true
  } catch (err) {
    console.error('Resend API failed:', err.message)
    return false
  }
}

// Mailer: Send OTP Email
async function sendOTPEmail(email, name, otp, type) {
  const isLogin = type === 'login'
  const isSignup = type === 'signup'
  const subject = isSignup ? 'TSPL Portal - Email Verification OTP' : (isLogin ? 'TSPL Portal - Secure Login OTP' : 'TSPL Portal - Password Reset OTP')
  const title = isSignup ? 'Email Verification' : (isLogin ? 'Secure Login Verification' : 'Password Reset Authorization')
  const description = isSignup
    ? 'Please input the following code to verify your email address and activate your TSPL account.'
    : (isLogin
      ? 'Please input the following code in your verification panel to complete your login session.'
      : 'We received a request to change your TSPL account password. Enter this code to verify it is you.')

  const html = `
    <div style="background-color: #F8F9FA; padding: 40px 20px; font-family: 'Inter', Arial, sans-serif;">
      <div style="background-color: #FFFFFF; color: #111111; padding: 40px; text-align: center; border: 1px solid #E4E4E4; border-radius: 12px; max-width: 550px; margin: 0 auto; box-shadow: 0 4px 24px rgba(10, 10, 10, 0.06);">
        <div style="font-size: 28px; font-weight: 800; color: #000000; margin-bottom: 24px; letter-spacing: 1.5px; text-transform: uppercase;">
          TSPL <span style="color: #F81927;">PLATFORM</span>
        </div>
        <div style="border-top: 1px solid #E4E4E4; margin-bottom: 24px;"></div>
        <h2 style="color: #111111; font-size: 22px; margin-top: 0; margin-bottom: 16px; font-weight: 700;">${title}</h2>
        <p style="color: #5F5F5F; font-size: 15px; line-height: 1.6; margin-bottom: 28px; text-align: left;">
          Hello <strong style="color: #111111;">${name}</strong>,<br>${description}
        </p>
        <div style="background-color: #F81927; padding: 16px 40px; border-radius: 8px; display: inline-block; margin-bottom: 28px; box-shadow: 0 4px 12px rgba(248, 25, 39, 0.2);">
          <span style="font-size: 36px; font-weight: 800; color: #FFFFFF; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
        </div>
        <p style="color: #5F5F5F; font-size: 13px; margin-bottom: 24px;">
          This code will expire in <span style="color: #F81927; font-weight: 600;">${isSignup ? '10' : (isLogin ? '5' : '10')} minutes</span>.
        </p>
        <div style="border-top: 1px solid #E4E4E4; margin-bottom: 20px;"></div>
        <p style="color: #8A8A8A; font-size: 11px; margin: 0;">&copy; 2026 TSPL. All internal automation systems apply.</p>
      </div>
    </div>
  `

  console.log(`[OTP - ${type.toUpperCase()}] To: ${email} | Code: ${otp}`)

  const resendConfigured = !!process.env.RESEND_API_KEY
  if (resendConfigured) {
    const success = await sendMailViaResend(email, subject, html)
    if (!success) console.log(`⚠️ Resend failed for ${email}`)
  }
  return true
}

// Auto-provision Super Admin (runs once per cold start)
let superAdminProvisioned = false
async function provisionSuperAdmin(dbPool) {
  if (superAdminProvisioned) return
  superAdminProvisioned = true
  const email = process.env.SUPER_ADMIN_EMAIL
  const password = process.env.SUPER_ADMIN_PASSWORD
  if (!email || !password) return
  try {
    const result = await dbPool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (result.rows.length === 0) {
      const passHash = hashPassword(password)
      await dbPool.query(
        'INSERT INTO users (email, password_hash, name, default_role) VALUES ($1, $2, $3, $4)',
        [email.toLowerCase().trim(), passHash, 'System Super Admin', 'super_admin']
      )
    } else if (result.rows[0].default_role !== 'super_admin') {
      await dbPool.query('UPDATE users SET default_role = $1 WHERE email = $2', ['super_admin', email.toLowerCase().trim()])
    }
  } catch (err) {
    console.error('Super admin provision error:', err.message)
  }
}

// ==================== SERVERLESS HANDLER ====================
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Email')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const dbPool = getPool()
  if (!dbPool) {
    return res.status(500).json({ error: 'Database not configured. Set DATABASE_URL environment variable.' })
  }

  // Auto-provision super admin on first request
  await provisionSuperAdmin(dbPool)

  // Parse the route: /api/auth/register -> ['', 'api', 'auth', 'register']
  const url = new URL(req.url, `https://${req.headers.host}`)
  const pathname = url.pathname
  const body = req.body || {}

  try {
    // ---- POST /api/auth/register ----
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const { email, password, name } = body
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'All fields are required' })
      }
      const passHash = hashPassword(password)

      const result = await dbPool.query(
        'INSERT INTO users (email, password_hash, name, default_role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, default_role',
        [email.toLowerCase().trim(), passHash, name.trim(), 'candidate']
      )
      const user = result.rows[0]

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await dbPool.query(
        'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
        [email.toLowerCase().trim(), otp, expiresAt]
      )
      await sendOTPEmail(email.toLowerCase().trim(), name.trim(), otp, 'signup')

      return res.status(201).json({
        message: 'Account created! A verification code has been sent to your email.',
        otp_required: true,
        email: email.toLowerCase().trim(),
        user
      })
    }

    // ---- POST /api/auth/login ----
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = body
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
      }
      const result = await dbPool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()])
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid email or password credentials' })
      }
      const user = result.rows[0]
      if (user.password_hash !== hashPassword(password)) {
        return res.status(400).json({ error: 'Invalid email or password credentials' })
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
      await dbPool.query(
        'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
        [email.toLowerCase().trim(), otp, expiresAt]
      )
      await sendOTPEmail(email.toLowerCase().trim(), user.name, otp, 'login')

      return res.status(200).json({
        message: 'Secure OTP code dispatched to your registered email.',
        otp_required: true,
        email: email.toLowerCase().trim()
      })
    }

    // ---- POST /api/auth/verify-otp ----
    if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
      const { email, otp } = body
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP code are required' })
      }
      const result = await dbPool.query('SELECT * FROM otps WHERE email = $1', [email.toLowerCase().trim()])
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'No active verification code found for this email' })
      }
      const record = result.rows[0]
      if (new Date() > new Date(record.expires_at)) {
        return res.status(400).json({ error: 'Verification code has expired' })
      }
      if (record.otp_code !== otp.trim()) {
        return res.status(400).json({ error: 'Invalid verification code. Try again.' })
      }

      await dbPool.query('DELETE FROM otps WHERE email = $1', [email.toLowerCase().trim()])
      const userResult = await dbPool.query('SELECT id, email, name, default_role FROM users WHERE email = $1', [email.toLowerCase().trim()])

      return res.status(200).json({
        message: 'Identity confirmed successfully.',
        user: userResult.rows[0]
      })
    }

    // ---- POST /api/auth/request-reset ----
    if (pathname === '/api/auth/request-reset' && req.method === 'POST') {
      const { email } = body
      if (!email) {
        return res.status(400).json({ error: 'Email address is required' })
      }
      const result = await dbPool.query('SELECT name FROM users WHERE email = $1', [email.toLowerCase().trim()])
      if (result.rows.length === 0) {
        return res.status(200).json({ message: 'If the email is registered, a password reset code has been sent.' })
      }
      const name = result.rows[0].name
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await dbPool.query(
        'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
        [email.toLowerCase().trim(), otp, expiresAt]
      )
      await sendOTPEmail(email.toLowerCase().trim(), name, otp, 'reset')

      return res.status(200).json({
        message: 'Reset verification code sent to your email.',
        email: email.toLowerCase().trim()
      })
    }

    // ---- POST /api/auth/reset-password ----
    if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
      const { email, otp, newPassword } = body
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'All fields are required' })
      }
      const result = await dbPool.query('SELECT * FROM otps WHERE email = $1', [email.toLowerCase().trim()])
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'No active password reset verification code found' })
      }
      const record = result.rows[0]
      if (new Date() > new Date(record.expires_at)) {
        return res.status(400).json({ error: 'Verification code has expired' })
      }
      if (record.otp_code !== otp.trim()) {
        return res.status(400).json({ error: 'Invalid verification code' })
      }

      await dbPool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashPassword(newPassword), email.toLowerCase().trim()])
      await dbPool.query('DELETE FROM otps WHERE email = $1', [email.toLowerCase().trim()])

      return res.status(200).json({ message: 'Password updated successfully. You can now login.' })
    }

    // ---- POST /api/auth/me ----
    if (pathname === '/api/auth/me' && req.method === 'POST') {
      const { email } = body
      if (!email) {
        return res.status(401).json({ error: 'Authentication missing' })
      }
      const result = await dbPool.query('SELECT id, email, name, default_role FROM users WHERE email = $1', [email.toLowerCase().trim()])
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User does not exist in register database' })
      }
      return res.status(200).json({ user: result.rows[0] })
    }

    // ---- GET /api/admin/users ----
    if (pathname === '/api/admin/users' && req.method === 'GET') {
      const adminEmail = req.headers['x-admin-email']
      if (!adminEmail) {
        return res.status(401).json({ error: 'Admin identifier not provided' })
      }
      const adminCheck = await dbPool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()])
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].default_role !== 'super_admin') {
        return res.status(403).json({ error: 'Access restricted to system Super Admin' })
      }
      const result = await dbPool.query('SELECT id, email, name, default_role FROM users ORDER BY name ASC')
      return res.status(200).json({ users: result.rows })
    }

    // ---- POST /api/admin/update-role ----
    if (pathname === '/api/admin/update-role' && req.method === 'POST') {
      const adminEmail = req.headers['x-admin-email']
      const { userId, newRole } = body
      if (!adminEmail || !userId || !newRole) {
        return res.status(400).json({ error: 'Admin headers and parameters required' })
      }
      const adminCheck = await dbPool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()])
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].default_role !== 'super_admin') {
        return res.status(403).json({ error: 'Access restricted to system Super Admin' })
      }
      await dbPool.query('UPDATE users SET default_role = $1 WHERE id = $2', [newRole, userId])
      return res.status(200).json({ message: 'User role updated successfully' })
    }

    // ---- 404 ----
    return res.status(404).json({ error: 'API endpoint not found' })

  } catch (error) {
    console.error('API Error:', error.message)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
