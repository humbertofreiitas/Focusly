'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function Cadastro() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Verifique seu email para confirmar o cadastro')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#a78bfa' }}>
            Focusly
          </h1>
          <p className="text-lg" style={{ color: '#8b8b9e' }}>
            Crie sua conta grátis
          </p>
        </div>

        {/* Registration Card */}
        <div 
          className="rounded-2xl p-8 border"
          style={{ 
            backgroundColor: '#13131a',
            borderColor: '#1e1e2e'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#f8f8ff' }}
              >
                Nome completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: '#0a0a0f',
                  borderColor: '#1e1e2e',
                  color: '#f8f8ff'
                }}
                placeholder="Seu nome completo"
              />
            </div>

            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#f8f8ff' }}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: '#0a0a0f',
                  borderColor: '#1e1e2e',
                  color: '#f8f8ff'
                }}
                placeholder="seu@email.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#f8f8ff' }}
              >
                Senha
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: '#0a0a0f',
                  borderColor: '#1e1e2e',
                  color: '#f8f8ff'
                }}
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#f8f8ff' }}
              >
                Confirmar senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: '#0a0a0f',
                  borderColor: '#1e1e2e',
                  color: '#f8f8ff'
                }}
                placeholder="••••••••"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: '#7c6af7'
              }}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p style={{ color: '#8b8b9e' }}>
              Já tem uma conta?{' '}
              <a 
                href="/" 
                className="font-semibold hover:underline transition-colors"
                style={{ color: '#a78bfa' }}
              >
                Fazer login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
