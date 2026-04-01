import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Search,
  LayoutDashboard,
  Star,
  FileText,
  Sparkles,
  Code,
  BookOpen,
  Columns,
  Lock,
  User,
  DollarSign,
  Calendar,
  FileEdit,
  Settings,
  Heart,
  ListChecks,
  Music,
  Receipt,
  Calculator,
  Package,
  FileSpreadsheet,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

interface TutorialModule {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  features: string[];
  howToUse: string[];
  tips: string[];
}

const tutorialModules: TutorialModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'O Dashboard é a tela inicial do sistema, oferecendo uma visão geral de todas as suas atividades e dados importantes.',
    features: [
      'Resumo de tarefas pendentes do Kanban',
      'Visão rápida das finanças',
      'Acesso rápido aos módulos mais usados',
      'Estatísticas gerais do sistema',
    ],
    howToUse: [
      'Ao abrir o sistema, você será direcionado automaticamente ao Dashboard',
      'Use os cards para ter uma visão rápida de cada área',
      'Clique nos elementos para ir diretamente ao módulo correspondente',
    ],
    tips: [
      'Mantenha o Dashboard como sua página inicial para ter sempre uma visão geral',
      'Use os atalhos de teclado para navegar mais rapidamente',
    ],
  },
  {
    id: 'wellness',
    label: 'Bem-Estar',
    icon: Heart,
    description: 'O módulo de Bem-Estar ajuda você a cuidar da sua saúde mental e física durante o trabalho, com ferramentas de relaxamento e pausas programadas.',
    features: [
      'Timer Pomodoro integrado para gestão de tempo',
      'Lembretes de pausas e alongamentos',
      'Sons relaxantes e música ambiente',
      'Exercícios de respiração guiados',
      'Registro de humor diário',
    ],
    howToUse: [
      'Acesse o módulo clicando em "Bem-Estar" no menu lateral',
      'Configure o timer Pomodoro com seus tempos preferidos de trabalho e pausa',
      'Ative os sons ambiente durante o trabalho para maior concentração',
      'Faça os exercícios de respiração durante as pausas',
      'Registre seu humor diariamente para acompanhar seu bem-estar',
    ],
    tips: [
      'Use a técnica Pomodoro: 25 minutos de foco, 5 minutos de pausa',
      'Levante-se e alongue-se a cada pausa',
      'Mantenha um copo de água por perto',
    ],
  },
  {
    id: 'musica',
    label: 'Biblioteca de Músicas',
    icon: Music,
    description: 'Gerencie sua biblioteca de músicas para ouvir enquanto trabalha. Organize playlists e controle a reprodução diretamente do sistema.',
    features: [
      'Player de música integrado',
      'Suporte a arquivos de áudio locais',
      'Categorias: Lo-Fi, Meditação, Ruído Branco',
      'Controle de volume e reprodução',
      'Mini player flutuante',
    ],
    howToUse: [
      'Adicione arquivos de áudio às pastas correspondentes em public/audios/',
      'Organize por categorias: lofi, meditation, whitenoise',
      'Use o player para controlar a reprodução',
      'O mini player permite controle sem sair da tela atual',
    ],
    tips: [
      'Lo-Fi é ótimo para concentração em tarefas criativas',
      'Ruído branco ajuda a bloquear distrações',
      'Use fones de ouvido para melhor experiência',
    ],
  },
  {
    id: 'favorites',
    label: 'Favoritos',
    icon: Star,
    description: 'Salve e organize seus links, recursos e referências favoritas para acesso rápido.',
    features: [
      'Adicionar links com título e descrição',
      'Organização por categorias',
      'Busca rápida por favoritos',
      'Ícones automáticos baseados no domínio',
    ],
    howToUse: [
      'Clique em "Adicionar Favorito" para salvar um novo link',
      'Preencha o título, URL e categoria',
      'Use a barra de busca para encontrar favoritos rapidamente',
      'Clique no favorito para abrir em nova aba',
    ],
    tips: [
      'Organize por projetos ou tipos de recurso',
      'Use descrições claras para facilitar a busca',
      'Revise periodicamente e remova links obsoletos',
    ],
  },
  {
    id: 'notes',
    label: 'Notas',
    icon: FileText,
    description: 'Crie e organize suas notas pessoais e profissionais. Suporte a Markdown para formatação rica.',
    features: [
      'Editor de texto com suporte a Markdown',
      'Organização por categorias e tags',
      'Busca em todas as notas',
      'Favoritar notas importantes',
      'Visualização em lista ou grade',
    ],
    howToUse: [
      'Clique em "Nova Nota" para criar uma nota',
      'Use Markdown para formatar: **negrito**, *itálico*, # títulos',
      'Adicione tags para organização',
      'Use a busca para encontrar notas específicas',
    ],
    tips: [
      'Use títulos descritivos para facilitar a busca',
      'Crie templates para notas recorrentes',
      'Revise e organize suas notas semanalmente',
    ],
  },
  {
    id: 'prompts',
    label: 'Prompts IA',
    icon: Sparkles,
    description: 'Armazene e organize seus prompts para ferramentas de IA como ChatGPT, Claude, Midjourney, etc.',
    features: [
      'Biblioteca de prompts organizados',
      'Categorização por ferramenta de IA',
      'Copiar prompt com um clique',
      'Variáveis personalizáveis nos prompts',
      'Avaliação e favoritos',
    ],
    howToUse: [
      'Adicione novos prompts com título e conteúdo',
      'Selecione a categoria/ferramenta de IA',
      'Use variáveis como {nome} para personalização',
      'Clique para copiar e use na ferramenta de IA',
    ],
    tips: [
      'Teste e refine seus prompts regularmente',
      'Organize por caso de uso (código, escrita, imagens)',
      'Documente quais prompts funcionam melhor',
    ],
  },
  {
    id: 'snippets',
    label: 'Snippets',
    icon: Code,
    description: 'Salve trechos de código reutilizáveis com syntax highlighting para várias linguagens de programação.',
    features: [
      'Syntax highlighting para múltiplas linguagens',
      'Organização por linguagem e categoria',
      'Copiar código com um clique',
      'Busca por título ou conteúdo',
      'Favoritar snippets mais usados',
    ],
    howToUse: [
      'Clique em "Novo Snippet" para adicionar código',
      'Selecione a linguagem para syntax highlighting correto',
      'Adicione título descritivo e tags',
      'Use o botão de copiar para usar o snippet',
    ],
    tips: [
      'Mantenha snippets pequenos e focados',
      'Adicione comentários explicativos no código',
      'Organize por projeto ou funcionalidade',
    ],
  },
  {
    id: 'cheatsheet',
    label: 'Cheatsheet',
    icon: BookOpen,
    description: 'Crie e mantenha suas próprias folhas de referência rápida para comandos, atalhos e sintaxes.',
    features: [
      'Criação de cheatsheets personalizados',
      'Organização por tecnologia/ferramenta',
      'Formatação com Markdown',
      'Busca rápida',
      'Impressão otimizada',
    ],
    howToUse: [
      'Crie um novo cheatsheet selecionando a categoria',
      'Adicione comandos/atalhos com descrições',
      'Use a busca para encontrar rapidamente',
      'Mantenha atualizado conforme aprende novos comandos',
    ],
    tips: [
      'Foque nos comandos que você mais esquece',
      'Revise após aprender algo novo',
      'Organize do mais básico ao avançado',
    ],
  },
  {
    id: 'kanban',
    label: 'Kanban',
    icon: Columns,
    description: 'Gerencie suas tarefas e projetos usando o método Kanban com colunas personalizáveis.',
    features: [
      'Colunas: A Fazer, Em Progresso, Concluído',
      'Arrastar e soltar tarefas entre colunas',
      'Prioridades e etiquetas coloridas',
      'Datas de vencimento',
      'Filtros e ordenação',
    ],
    howToUse: [
      'Adicione tarefas na coluna "A Fazer"',
      'Arraste para "Em Progresso" ao iniciar',
      'Mova para "Concluído" ao finalizar',
      'Use etiquetas para categorizar',
      'Defina prioridades e datas limite',
    ],
    tips: [
      'Limite tarefas "Em Progresso" para manter foco',
      'Revise o quadro diariamente',
      'Arquive tarefas concluídas periodicamente',
    ],
  },
  {
    id: 'checklists',
    label: 'Listas Pessoais',
    icon: ListChecks,
    description: 'Crie checklists para rotinas, procedimentos e listas de verificação pessoais.',
    features: [
      'Listas com itens marcáveis',
      'Templates reutilizáveis',
      'Listas recorrentes (diárias, semanais)',
      'Progresso visual',
      'Organização por categorias',
    ],
    howToUse: [
      'Crie uma nova lista com título',
      'Adicione itens à lista',
      'Marque itens conforme completa',
      'Use templates para listas recorrentes',
    ],
    tips: [
      'Crie listas para rotinas diárias',
      'Use para procedimentos que não pode esquecer',
      'Revise e atualize templates periodicamente',
    ],
  },
  {
    id: 'passwords',
    label: 'Senhas',
    icon: Lock,
    description: 'Armazene suas senhas de forma segura com criptografia. Requer senha mestra configurada.',
    features: [
      'Armazenamento criptografado',
      'Gerador de senhas fortes',
      'Organização por categoria',
      'Copiar senha com um clique',
      'Proteção por senha mestra',
    ],
    howToUse: [
      'Configure a senha mestra em Configurações primeiro',
      'Adicione credenciais com site, usuário e senha',
      'Use o gerador para criar senhas fortes',
      'Clique para copiar (a senha é ocultada por padrão)',
    ],
    tips: [
      'Use senhas únicas para cada serviço',
      'Ative autenticação de dois fatores quando possível',
      'Mantenha sua senha mestra segura e memorizada',
      'Faça backup regular dos dados',
    ],
  },
  {
    id: 'contacts',
    label: 'Contatos',
    icon: User,
    description: 'Gerencie sua lista de contatos pessoais e profissionais com informações detalhadas.',
    features: [
      'Cadastro completo de contatos',
      'Campos personalizados',
      'Categorização (pessoal, trabalho, cliente)',
      'Busca rápida',
      'Exportação de contatos',
    ],
    howToUse: [
      'Adicione contatos com nome e informações',
      'Categorize por tipo de relacionamento',
      'Use a busca para encontrar rapidamente',
      'Mantenha informações atualizadas',
    ],
    tips: [
      'Adicione notas sobre como conheceu a pessoa',
      'Mantenha emails e telefones atualizados',
      'Use categorias para filtrar contatos',
    ],
  },
  {
    id: 'orcamentos',
    label: 'Orçamentos',
    icon: Receipt,
    description: 'Crie e gerencie orçamentos profissionais para seus clientes e projetos.',
    features: [
      'Criação de orçamentos detalhados',
      'Itens com quantidade e preço',
      'Cálculo automático de totais',
      'Status do orçamento (pendente, aprovado, recusado)',
      'Exportação em PDF',
    ],
    howToUse: [
      'Crie um novo orçamento selecionando o cliente',
      'Adicione itens com descrição, quantidade e valor',
      'Revise o total calculado automaticamente',
      'Envie ao cliente e atualize o status',
    ],
    tips: [
      'Seja detalhado na descrição dos itens',
      'Inclua prazo de validade do orçamento',
      'Acompanhe o status para follow-up',
    ],
  },
  {
    id: 'precificador',
    label: 'Precificador',
    icon: Calculator,
    description: 'Calcule preços de produtos e serviços considerando custos, margem e impostos.',
    features: [
      'Cálculo de custo total',
      'Definição de margem de lucro',
      'Inclusão de impostos',
      'Comparação de cenários',
      'Histórico de precificações',
    ],
    howToUse: [
      'Adicione todos os custos do produto/serviço',
      'Defina a margem de lucro desejada',
      'Configure os impostos aplicáveis',
      'Veja o preço final sugerido',
    ],
    tips: [
      'Inclua todos os custos, mesmo os pequenos',
      'Revise preços periodicamente',
      'Compare com preços de mercado',
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque',
    icon: Package,
    description: 'Controle seu estoque de produtos e insumos com alertas de quantidade mínima.',
    features: [
      'Cadastro de produtos',
      'Controle de quantidade',
      'Alertas de estoque baixo',
      'Histórico de movimentações',
      'Categorização de produtos',
    ],
    howToUse: [
      'Cadastre produtos com nome, quantidade e mínimo',
      'Registre entradas e saídas',
      'Configure alertas de estoque mínimo',
      'Acompanhe o histórico de movimentações',
    ],
    tips: [
      'Faça inventário periódico',
      'Configure alertas para não ficar sem produtos',
      'Mantenha fornecedores cadastrados',
    ],
  },
  {
    id: 'fichatecnica',
    label: 'Ficha Técnica',
    icon: FileSpreadsheet,
    description: 'Crie fichas técnicas detalhadas para produtos, receitas ou procedimentos.',
    features: [
      'Fichas técnicas completas',
      'Lista de ingredientes/componentes',
      'Modo de preparo/montagem',
      'Custo calculado automaticamente',
      'Fotos e anexos',
    ],
    howToUse: [
      'Crie uma nova ficha técnica',
      'Adicione ingredientes/componentes do estoque',
      'Descreva o modo de preparo',
      'O custo é calculado automaticamente',
    ],
    tips: [
      'Seja preciso nas quantidades',
      'Inclua tempo de preparo',
      'Adicione fotos do resultado final',
    ],
  },
  {
    id: 'finance',
    label: 'Financeiro',
    icon: DollarSign,
    description: 'Controle suas finanças pessoais e empresariais com receitas, despesas e relatórios.',
    features: [
      'Registro de receitas e despesas',
      'Categorização de transações',
      'Gráficos e relatórios',
      'Saldo atual e projeções',
      'Transações recorrentes',
    ],
    howToUse: [
      'Adicione transações com valor e categoria',
      'Use valores positivos para receitas, negativos para despesas',
      'Acompanhe o saldo e gráficos',
      'Configure transações recorrentes',
    ],
    tips: [
      'Registre transações diariamente',
      'Use categorias consistentes',
      'Revise relatórios mensalmente',
    ],
  },
  {
    id: 'diary',
    label: 'Diário',
    icon: Calendar,
    description: 'Mantenha um diário pessoal para reflexões, ideias e registro do dia a dia.',
    features: [
      'Entradas diárias',
      'Marcação de humor',
      'Tags e categorias',
      'Busca por data ou conteúdo',
      'Privacidade total',
    ],
    howToUse: [
      'Crie uma nova entrada para o dia',
      'Escreva suas reflexões e acontecimentos',
      'Marque seu humor do dia',
      'Use tags para organizar temas',
    ],
    tips: [
      'Escreva no mesmo horário todos os dias',
      'Seja honesto em suas reflexões',
      'Releia entradas antigas periodicamente',
    ],
  },
  {
    id: 'draft',
    label: 'Rascunho',
    icon: FileEdit,
    description: 'Área de rascunho rápido para anotações temporárias e textos em desenvolvimento.',
    features: [
      'Editor de texto simples',
      'Salvamento automático',
      'Sem necessidade de organização',
      'Acesso rápido',
    ],
    howToUse: [
      'Use para anotações rápidas',
      'Cole textos temporários',
      'Desenvolva ideias antes de mover para Notas',
      'Limpe quando não precisar mais',
    ],
    tips: [
      'Use para capturar ideias rapidamente',
      'Mova conteúdo importante para Notas',
      'Limpe regularmente para manter organizado',
    ],
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    description: 'Configure todas as preferências do sistema, tema, módulos e backup de dados.',
    features: [
      'Tema claro/escuro',
      'Gerenciamento de projetos',
      'Habilitar/desabilitar módulos',
      'Senha mestra para dados sensíveis',
      'Backup e restauração de dados',
    ],
    howToUse: [
      'Altere o tema conforme preferência',
      'Gerencie seus projetos',
      'Desabilite módulos que não usa',
      'Configure a senha mestra',
      'Faça backup regular dos dados',
    ],
    tips: [
      'Faça backup semanal dos dados',
      'Desabilite módulos não usados para interface limpa',
      'Use senha mestra forte e memorável',
    ],
  },
];

export default function Tutorial() {
  const { state } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar apenas módulos habilitados
  const enabledTutorials = tutorialModules.filter(module =>
    state.enabledModules.includes(module.id)
  );

  // Filtrar por busca
  const filteredTutorials = enabledTutorials.filter(module =>
    module.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            Central de Ajuda
          </h1>
          <p className="text-muted-foreground mt-1">
            Aprenda a usar cada módulo do sistema
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo à Central de Comando!</CardTitle>
          <CardDescription>
            Este sistema foi desenvolvido para centralizar todas as suas ferramentas de produtividade em um só lugar.
            Abaixo você encontra tutoriais detalhados de cada módulo disponível.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <p><strong>Dicas Gerais:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Use <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+K</kbd> para abrir a paleta de comandos</li>
              <li>O menu lateral pode ser recolhido para mais espaço de trabalho</li>
              <li>Todos os dados são salvos automaticamente no seu navegador</li>
              <li>Faça backup regularmente em Configurações → Backup do Sistema</li>
              <li>Personalize os módulos ativos em Configurações → Gerenciar Módulos</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[calc(100vh-350px)]">
        <Accordion type="single" collapsible className="space-y-2">
          {filteredTutorials.map((module) => {
            const Icon = module.icon;
            return (
              <AccordionItem
                key={module.id}
                value={module.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{module.label}</div>
                      <div className="text-sm text-muted-foreground font-normal">
                        {module.description.slice(0, 60)}...
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-6">
                    <div>
                      <p className="text-muted-foreground">{module.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Badge variant="outline">Funcionalidades</Badge>
                      </h4>
                      <ul className="grid gap-1.5 sm:grid-cols-2">
                        {module.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Badge variant="outline">Como Usar</Badge>
                      </h4>
                      <ol className="space-y-2">
                        {module.howToUse.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                              {idx + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Badge variant="outline">Dicas</Badge>
                      </h4>
                      <ul className="space-y-1.5">
                        {module.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-yellow-500">💡</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
