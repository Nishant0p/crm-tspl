import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import pg from 'pg'
import crypto from 'crypto'

dotenv.config()

const { Pool } = pg

// Setup PostgreSQL pool
let pool
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
  } catch (e) {
    console.error("Failed to initialize database pool inside Vite config:", e.message)
  }
} else {
  console.warn("⚠️ DATABASE_URL not found in .env file.")
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Mailer: Send Mail via Resend REST API
async function sendMailViaResend(email, subject, htmlContent) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return false
  }
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
    if (!response.ok) {
      throw new Error(data.message || 'Resend HTTP delivery failure')
    }
    console.log(`◇ Email successfully dispatched via Resend API to ${email} (ID: ${data.id})`)
    return true
  } catch (err) {
    console.error('Resend API delivery failed:', err.message)
    return false
  }
}

// Mailer: Send Welcome HTML Email
async function sendWelcomeEmail(email, name) {
  const html = `
    <div style="background-color: #F8F9FA; padding: 40px 20px; font-family: 'Inter', Arial, sans-serif;">
      <div style="background-color: #FFFFFF; color: #111111; padding: 40px; text-align: center; border: 1px solid #E4E4E4; border-radius: 12px; max-width: 550px; margin: 0 auto; box-shadow: 0 4px 24px rgba(10, 10, 10, 0.06);">
        <div style="font-size: 28px; font-weight: 800; color: #000000; margin-bottom: 24px; letter-spacing: 1.5px; text-transform: uppercase;">
          TSPL <span style="color: #F81927;">PLATFORM</span>
        </div>
        <div style="border-top: 1px solid #E4E4E4; margin-bottom: 24px;"></div>
        <h2 style="color: #111111; font-size: 22px; margin-top: 0; margin-bottom: 16px; font-weight: 700; letter-spacing: -0.5px;">
          Welcome Aboard, ${name}!
        </h2>
        <p style="color: #5F5F5F; font-size: 15px; line-height: 1.6; margin-bottom: 28px; text-align: left;">
          Hello <strong style="color: #111111;">${name}</strong>,<br>
          Your enterprise profile has been successfully registered. You now have full access to our Unified Sourcing, Job Placements, and Skill Ecosystem.
        </p>
        <div style="background-color: #FFFFFF; border: 1px solid #E4E4E4; padding: 12px 24px; border-radius: 6px; display: inline-block; margin-bottom: 28px;">
          <span style="color: #F81927; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;">Candidate Profile Verified ✓</span>
        </div>
        <div style="border-top: 1px solid #E4E4E4; margin-bottom: 20px;"></div>
        <p style="color: #8A8A8A; font-size: 11px; margin: 0; line-height: 1.4;">
          This is an automated notification from TSPL Academic Registry.<br>
          &copy; 2026 TSPL. All internal automation systems apply.
        </p>
      </div>
    </div>
  `
  const resendConfigured = !!process.env.RESEND_API_KEY
  if (resendConfigured) {
    return await sendMailViaResend(email, 'Welcome to TSPL Platform!', html)
  }
  console.log(`\n======================================================`);
  console.log(`[MOCK Welcome Email]`);
  console.log(`To: ${email}`);
  console.log(`Subject: Welcome to TSPL Platform!`);
  console.log(`Body: Hello ${name}, welcome to the TSPL ecosystem.`);
  console.log(`======================================================\n`);
  return true
}

// Mailer: Send OTP Verification Code Email
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
        <h2 style="color: #111111; font-size: 22px; margin-top: 0; margin-bottom: 16px; font-weight: 700; letter-spacing: -0.5px;">
          ${title}
        </h2>
        <p style="color: #5F5F5F; font-size: 15px; line-height: 1.6; margin-bottom: 28px; text-align: left;">
          Hello <strong style="color: #111111;">${name}</strong>,<br>
          ${description}
        </p>
        <div style="background-color: #F81927; padding: 16px 40px; border-radius: 8px; display: inline-block; margin-bottom: 28px; box-shadow: 0 4px 12px rgba(248, 25, 39, 0.2);">
          <span style="font-size: 36px; font-weight: 800; color: #FFFFFF; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${otp}
          </span>
        </div>
        <p style="color: #5F5F5F; font-size: 13px; margin-bottom: 24px;">
          This security verification code will expire in <span style="color: #F81927; font-weight: 600;">${isSignup ? '10' : (isLogin ? '5' : '10')} minutes</span>.
        </p>
        <div style="border-top: 1px solid #E4E4E4; margin-bottom: 20px;"></div>
        <p style="color: #8A8A8A; font-size: 11px; margin: 0; line-height: 1.4;">
          If you did not make this transaction request, please ignore this email securely.<br>
          &copy; 2026 TSPL. All internal automation systems apply.
        </p>
      </div>
    </div>
  `

  console.log(`\n======================================================`);
  console.log(`[SERVER CONSOLE OTP - ${type.toUpperCase()}]`);
  console.log(`To: ${email}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`======================================================\n`);

  const resendConfigured = !!process.env.RESEND_API_KEY
  if (resendConfigured) {
    const success = await sendMailViaResend(email, subject, html)
    if (!success) {
      console.log(`⚠️ Resend email delivery failed for ${email}. Please copy the OTP from the console log above.`)
    }
  }

  return true
}

// Auto-provision Super Admin on startup inside Vite
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD
if (pool && superAdminEmail && superAdminPassword) {
  pool.query('SELECT * FROM users WHERE email = $1', [superAdminEmail.toLowerCase().trim()])
    .then(async (result) => {
      if (result.rows.length === 0) {
        const passHash = hashPassword(superAdminPassword)
        await pool.query(
          'INSERT INTO users (email, password_hash, name, default_role) VALUES ($1, $2, $3, $4)',
          [superAdminEmail.toLowerCase().trim(), passHash, 'System Super Admin', 'super_admin']
        )
        console.log(`◇ Automatically provisioned default Super Admin account: ${superAdminEmail}`)
      } else {
        const existing = result.rows[0]
        if (existing.default_role !== 'super_admin') {
          await pool.query(
            'UPDATE users SET default_role = $1 WHERE email = $2',
            ['super_admin', superAdminEmail.toLowerCase().trim()]
          )
          console.log(`◇ Adjusted user role to super_admin for: ${superAdminEmail}`)
        }
      }
    })
    .catch(err => {
      console.error('Failed to auto-provision super admin:', err.message)
    })
}

// Helper to parse Connect request body
function getRequestBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (err) {
        resolve({})
      }
    })
  })
}

// Custom Vite API Plugin
function apiPlugin() {
  return {
    name: 'api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Set standard CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Email')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          res.end()
          return
        }

        const url = new URL(req.url, 'http://localhost')
        const pathname = url.pathname

        if (pathname.startsWith('/api/')) {
          res.setHeader('Content-Type', 'application/json')
          
          try {
            if (!pool) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Database pool is not initialized. Please configure DATABASE_URL in .env.' }))
              return
            }

            // 1. POST /api/auth/register
            if (pathname === '/api/auth/register' && req.method === 'POST') {
              const { email, password, name } = await getRequestBody(req)
              if (!email || !password || !name) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'All fields are required' }))
                return
              }
              const passHash = hashPassword(password)
              const userRole = 'candidate'
              
              const result = await pool.query(
                'INSERT INTO users (email, password_hash, name, default_role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, default_role',
                [email.toLowerCase().trim(), passHash, name.trim(), userRole]
              )
              const user = result.rows[0]

              // Generate and send signup verification OTP
              const otp = Math.floor(100000 + Math.random() * 900000).toString()
              const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

              await pool.query(
                'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
                [email.toLowerCase().trim(), otp, expiresAt]
              )

              await sendOTPEmail(email.toLowerCase().trim(), name.trim(), otp, 'signup')

              res.statusCode = 201
              res.end(JSON.stringify({
                message: 'Account created! A verification code has been sent to your email.',
                otp_required: true,
                email: email.toLowerCase().trim(),
                user
              }))
              return
            }

            // 2. POST /api/auth/login
            if (pathname === '/api/auth/login' && req.method === 'POST') {
              const { email, password } = await getRequestBody(req)
              if (!email || !password) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Email and password are required' }))
                return
              }
              const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()])
              if (result.rows.length === 0) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invalid email or password credentials' }))
                return
              }
              const user = result.rows[0]
              const passHash = hashPassword(password)
              if (user.password_hash !== passHash) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invalid email or password credentials' }))
                return
              }

              const otp = Math.floor(100000 + Math.random() * 900000).toString()
              const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

              await pool.query(
                'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
                [email.toLowerCase().trim(), otp, expiresAt]
              )

              await sendOTPEmail(email.toLowerCase().trim(), user.name, otp, 'login')

              res.statusCode = 200
              res.end(JSON.stringify({
                message: 'Secure OTP code dispatched to your registered email.',
                otp_required: true,
                email: email.toLowerCase().trim()
              }))
              return
            }

            // 3. POST /api/auth/verify-otp
            if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
              const { email, otp } = await getRequestBody(req)
              if (!email || !otp) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Email and OTP code are required' }))
                return
              }
              const result = await pool.query('SELECT * FROM otps WHERE email = $1', [email.toLowerCase().trim()])
              if (result.rows.length === 0) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'No active verification code found for this email' }))
                return
              }
              const record = result.rows[0]
              if (new Date() > new Date(record.expires_at)) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Verification code has expired' }))
                return
              }
              if (record.otp_code !== otp.trim()) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invalid verification code. Try again.' }))
                return
              }

              await pool.query('DELETE FROM otps WHERE email = $1', [email.toLowerCase().trim()])

              const userResult = await pool.query('SELECT id, email, name, default_role FROM users WHERE email = $1', [email.toLowerCase().trim()])
              const user = userResult.rows[0]

              res.statusCode = 200
              res.end(JSON.stringify({
                message: 'Identity confirmed successfully.',
                user
              }))
              return
            }

            // 4. POST /api/auth/request-reset
            if (pathname === '/api/auth/request-reset' && req.method === 'POST') {
              const { email } = await getRequestBody(req)
              if (!email) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Email address is required' }))
                return
              }
              const result = await pool.query('SELECT name FROM users WHERE email = $1', [email.toLowerCase().trim()])
              if (result.rows.length === 0) {
                res.statusCode = 200
                res.end(JSON.stringify({ message: 'If the email is registered, a password reset code has been sent.' }))
                return
              }
              const name = result.rows[0].name
              const otp = Math.floor(100000 + Math.random() * 900000).toString()
              const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

              await pool.query(
                'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
                [email.toLowerCase().trim(), otp, expiresAt]
              )

              await sendOTPEmail(email.toLowerCase().trim(), name, otp, 'reset')

              res.statusCode = 200
              res.end(JSON.stringify({
                message: 'Reset verification code sent to your email.',
                email: email.toLowerCase().trim()
              }))
              return
            }

            // 5. POST /api/auth/reset-password
            if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
              const { email, otp, newPassword } = await getRequestBody(req)
              if (!email || !otp || !newPassword) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'All fields are required' }))
                return
              }
              const result = await pool.query('SELECT * FROM otps WHERE email = $1', [email.toLowerCase().trim()])
              if (result.rows.length === 0) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'No active password reset verification code found' }))
                return
              }
              const record = result.rows[0]
              if (new Date() > new Date(record.expires_at)) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Verification code has expired' }))
                return
              }
              if (record.otp_code !== otp.trim()) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invalid verification code' }))
                return
              }

              const newHash = hashPassword(newPassword)
              await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, email.toLowerCase().trim()])
              await pool.query('DELETE FROM otps WHERE email = $1', [email.toLowerCase().trim()])

              res.statusCode = 200
              res.end(JSON.stringify({ message: 'Password updated successfully. You can now login.' }))
              return
            }

            // 6. POST /api/auth/me
            if (pathname === '/api/auth/me' && req.method === 'POST') {
              const { email } = await getRequestBody(req)
              if (!email) {
                res.statusCode = 401
                res.end(JSON.stringify({ error: 'Authentication missing' }))
                return
              }
              const result = await pool.query('SELECT id, email, name, default_role FROM users WHERE email = $1', [email.toLowerCase().trim()])
              if (result.rows.length === 0) {
                res.statusCode = 401
                res.end(JSON.stringify({ error: 'User does not exist in register database' }))
                return
              }
              res.statusCode = 200
              res.end(JSON.stringify({ user: result.rows[0] }))
              return
            }

            // 7. GET /api/admin/users
            if (pathname === '/api/admin/users' && req.method === 'GET') {
              const adminEmail = req.headers['x-admin-email']
              if (!adminEmail) {
                res.statusCode = 401
                res.end(JSON.stringify({ error: 'Admin identifier not provided' }))
                return
              }
              const adminCheck = await pool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()])
              if (adminCheck.rows.length === 0 || adminCheck.rows[0].default_role !== 'super_admin') {
                res.statusCode = 403
                res.end(JSON.stringify({ error: 'Access restricted to system Super Admin' }))
                return
              }
              const result = await pool.query('SELECT id, email, name, default_role FROM users ORDER BY name ASC')
              res.statusCode = 200
              res.end(JSON.stringify({ users: result.rows }))
              return
            }

            // 8. POST /api/admin/update-role
            if (pathname === '/api/admin/update-role' && req.method === 'POST') {
              const adminEmail = req.headers['x-admin-email']
              const { userId, newRole } = await getRequestBody(req)
              if (!adminEmail || !userId || !newRole) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Admin headers and parameters required' }))
                return
              }
              const adminCheck = await pool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()])
              if (adminCheck.rows.length === 0 || adminCheck.rows[0].default_role !== 'super_admin') {
                res.statusCode = 403
                res.end(JSON.stringify({ error: 'Access restricted to system Super Admin' }))
                return
              }
              
              await pool.query('UPDATE users SET default_role = $1 WHERE id = $2', [newRole, userId])
              res.statusCode = 200
              res.end(JSON.stringify({ message: 'User role updated successfully' }))
              return
            }

            // Unknown API endpoint
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'API Endpoint not found' }))
            return

          } catch (error) {
            console.error('API Error in Vite dev server:', error.message)
            res.statusCode = 500
            res.end(JSON.stringify({ error: error.message || 'Database error inside Vite dev server' }))
            return
          }
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()]
})
