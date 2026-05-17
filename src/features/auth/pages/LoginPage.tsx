import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../services/firebase';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Button, Card, Input } from '../../../shared';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Se já está autenticado, redireciona para o dashboard apropriado
  useEffect(() => {
    if (user) {
      const dashboards = {
        admin: '/admin',
        root: '/admin',
        owner: '/workshop',
        mechanic: '/workshop',
        attendant: '/workshop',
      };
      const targetDashboard = dashboards[user.role] || '/admin';
      navigate(targetDashboard, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    void (async () => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // Mantemos o estado de envio ativo ate o redirecionamento via useEffect.
      } catch (err) {
        console.error('Login failed:', err);
        setError('Falha ao fazer login. Verifique e-mail e senha.');
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-mecfix-orange/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-mecfix-navy/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-[78vh] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-white/70 bg-mecfix-navy p-8 text-white shadow-[0_30px_90px_rgba(11,28,54,0.35)] lg:p-12">
          <p className="mb-6 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1 text-sm font-semibold tracking-wide text-white">
            Gestao para oficinas
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-white lg:text-5xl">
            MecFix
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-100 lg:text-lg">
            A Ferramenta Digital da Sua Oficina
          </p>
          <div className="mt-8 space-y-3 text-sm text-slate-200 lg:text-base">
            <p>Controle de clientes, veiculos, orcamentos e financeiro.</p>
            <p>Fluxo rapido para atendimento e acompanhamento em tempo real.</p>
            <p>Base pronta para escalar do piloto ao dia a dia da oficina.</p>
          </div>
        </section>

        <Card className="w-full">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Entrar na plataforma</h2>
            <p className="mt-2 text-sm text-slate-600">Use suas credenciais para acessar o painel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="E-mail"
              disabled={isSubmitting}
              required
            />

            <Input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Senha"
              disabled={isSubmitting}
              required
            />

            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700">{error}</div>}

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full"
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            <p>Sem conta? Entre em contato conosco para comecar.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
