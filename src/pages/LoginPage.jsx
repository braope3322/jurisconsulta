import { useState } from 'react'
import { Scale, Lock, User, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'

const CREDENTIALS = {
  usuario: 'admin',
  senha: 'admin123'
}

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ usuario: '', senha: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    await new Promise(r => setTimeout(r, 800))

    if (form.usuario === CREDENTIALS.usuario && form.senha === CREDENTIALS.senha) {
      localStorage.setItem('admin_auth', 'true')
      onLogin()
    } else {
      setError('Usuário ou senha incorretos')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2364af]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#2364af]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#2364af] to-[#1a4f8f] rounded-2xl shadow-lg shadow-[#2364af]/30 mb-4">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">JurisConsulta</h1>
          <p className="text-sm text-gray-400 mt-1">Painel Administrativo</p>
        </div>

        {/* Login card */}
        <div className="bg-[#1e293b]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-white mb-2">Bem-vindo de volta</h2>
              <p className="text-sm text-gray-400">Faça login para acessar o painel</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Usuário</label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={form.usuario}
                    onChange={e => setForm({ ...form, usuario: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-[#0f172a]/60 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] focus:ring-2 focus:ring-[#2364af]/20 transition-all"
                    placeholder="Digite seu usuário"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Senha</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.senha}
                    onChange={e => setForm({ ...form, senha: e.target.value })}
                    className="w-full pl-12 pr-12 py-4 bg-[#0f172a]/60 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] focus:ring-2 focus:ring-[#2364af]/20 transition-all"
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#2364af] to-[#1a4f8f] hover:from-[#1a4f8f] hover:to-[#143d6e] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer shadow-lg shadow-[#2364af]/25"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Entrar
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-[#0f172a]/40 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Acesso seguro e criptografado</span>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs text-gray-600 mt-8">
          JurisConsulta © {new Date().getFullYear()} — Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
