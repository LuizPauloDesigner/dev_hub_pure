import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Plus, X, Mail, Phone, Building2, Briefcase, User, Search } from 'lucide-react';
import { toast } from 'sonner';

export const Contacts = () => {
  const { state, currentProject, addContact, updateContact, deleteContact } = useApp();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    telefones: [''],
    emails: [''],
    empresa: '',
    cargo: '',
    tags: [] as string[],
    notas: '',
  });

  const projectContacts = useMemo(() => {
    return (state.contacts || []).filter(c => c.projectId === currentProject);
  }, [state.contacts, currentProject]);

  const filteredContacts = useMemo(() => {
    return projectContacts.filter(contact => {
      const matchesSearch = contact.nomeCompleto.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           contact.empresa.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTagFilter || contact.tags.includes(selectedTagFilter);
      return matchesSearch && matchesTag;
    });
  }, [projectContacts, searchQuery, selectedTagFilter]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projectContacts.forEach(contact => {
      contact.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [projectContacts]);

  const selectedContact = selectedContactId 
    ? projectContacts.find(c => c.id === selectedContactId) 
    : null;

  const handleNewContact = () => {
    setIsCreating(true);
    setSelectedContactId(null);
    setFormData({
      nomeCompleto: '',
      telefones: [''],
      emails: [''],
      empresa: '',
      cargo: '',
      tags: [],
      notas: '',
    });
  };

  const handleSelectContact = (id: string) => {
    const contact = projectContacts.find(c => c.id === id);
    if (!contact) return;
    
    setSelectedContactId(id);
    setIsCreating(false);
    setFormData({
      nomeCompleto: contact.nomeCompleto,
      telefones: contact.telefones.length > 0 ? contact.telefones : [''],
      emails: contact.emails.length > 0 ? contact.emails : [''],
      empresa: contact.empresa,
      cargo: contact.cargo,
      tags: contact.tags,
      notas: contact.notas,
    });
  };

  const handleSave = () => {
    if (!formData.nomeCompleto.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    const cleanedData = {
      ...formData,
      telefones: formData.telefones.filter(t => t.trim() !== ''),
      emails: formData.emails.filter(e => e.trim() !== ''),
    };

    if (isCreating) {
      addContact({
        ...cleanedData,
        projectId: currentProject,
      });
      toast.success('Contato adicionado');
      setIsCreating(false);
    } else if (selectedContactId) {
      updateContact(selectedContactId, cleanedData);
      toast.success('Contato atualizado');
    }
  };

  const handleDelete = () => {
    if (!selectedContactId) return;
    if (confirm('Deseja realmente remover este contato?')) {
      deleteContact(selectedContactId);
      setSelectedContactId(null);
      setIsCreating(false);
      toast.success('Contato removido');
    }
  };

  const addField = (field: 'telefones' | 'emails') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeField = (field: 'telefones' | 'emails', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateField = (field: 'telefones' | 'emails', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Coluna Esquerda - Lista */}
      <div className="w-1/3 flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Contatos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTagFilter === tag ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Button onClick={handleNewContact} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Contato
            </Button>

            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-2">
                {filteredContacts.map(contact => (
                  <Card
                    key={contact.id}
                    className={`cursor-pointer transition-colors ${
                      selectedContactId === contact.id ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleSelectContact(contact.id)}
                  >
                    <CardContent className="p-3">
                      <div className="font-semibold">{contact.nomeCompleto}</div>
                      {contact.empresa && (
                        <div className="text-sm text-muted-foreground">{contact.empresa}</div>
                      )}
                      {contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {contact.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Coluna Direita - Detalhes */}
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Novo Contato' : selectedContact ? 'Detalhes do Contato' : 'Selecione um contato'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(isCreating || selectedContact) ? (
              <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                <div className="space-y-4">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input
                      value={formData.nomeCompleto}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomeCompleto: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefones
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addField('telefones')}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    {formData.telefones.map((tel, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <Input
                          value={tel}
                          onChange={(e) => updateField('telefones', idx, e.target.value)}
                          placeholder="Telefone"
                        />
                        {formData.telefones.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeField('telefones', idx)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        E-mails
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addField('emails')}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    {formData.emails.map((email, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => updateField('emails', idx, e.target.value)}
                          placeholder="E-mail"
                        />
                        {formData.emails.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeField('emails', idx)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Empresa
                    </Label>
                    <Input
                      value={formData.empresa}
                      onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Cargo
                    </Label>
                    <Input
                      value={formData.cargo}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                      placeholder="Cargo ou função"
                    />
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                          <X
                            className="w-3 h-3 ml-1 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Adicionar tag..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(state.contactTags || []).map(tag => (
                        !formData.tags.includes(tag) && (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => addTag(tag)}
                          >
                            + {tag}
                          </Badge>
                        )
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Notas</Label>
                    <Textarea
                      value={formData.notas}
                      onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                      placeholder="Informações adicionais..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex-1">
                      Salvar
                    </Button>
                    {!isCreating && (
                      <Button onClick={handleDelete} variant="destructive">
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Selecione um contato ou adicione um novo
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
