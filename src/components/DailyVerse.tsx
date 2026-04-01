import { BookOpen } from 'lucide-react';
import { useMemo } from 'react';

const VERSES = [
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", ref: "João 3:16" },
  { text: "O Senhor é o meu pastor; nada me faltará.", ref: "Salmos 23:1" },
  { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.", ref: "Provérbios 3:5" },
  { text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais.", ref: "Jeremias 29:11" },
  { text: "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão e não se cansarão; caminharão e não se fatigarão.", ref: "Isaías 40:31" },
  { text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.", ref: "Isaías 41:10" },
  { text: "E conhecereis a verdade, e a verdade vos libertará.", ref: "João 8:32" },
  { text: "Deleita-te também no Senhor, e ele te concederá o que deseja o teu coração.", ref: "Salmos 37:4" },
  { text: "Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai senão por mim.", ref: "João 14:6" },
  { text: "Lança o teu cuidado sobre o Senhor, e ele te susterá; não permitirá jamais que o justo seja abalado.", ref: "Salmos 55:22" },
  { text: "O Senhor é a minha luz e a minha salvação; a quem temerei?", ref: "Salmos 27:1" },
  { text: "Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos.", ref: "Filipenses 4:4" },
  { text: "Bem-aventurados os pacificadores, porque eles serão chamados filhos de Deus.", ref: "Mateus 5:9" },
  { text: "Porque para Deus nada é impossível.", ref: "Lucas 1:37" },
  { text: "Sede fortes e corajosos. Não temais, nem vos espanteis diante deles, porque o Senhor, vosso Deus, é quem vai convosco; não vos deixará, nem vos desamparará.", ref: "Deuteronômio 31:6" },
  { text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", ref: "Mateus 11:28" },
  { text: "A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza.", ref: "2 Coríntios 12:9" },
  { text: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.", ref: "1 Coríntios 13:4" },
  { text: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", ref: "Salmos 37:5" },
  { text: "Porque onde estiver o vosso tesouro, aí estará também o vosso coração.", ref: "Mateus 6:21" },
  { text: "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.", ref: "1 Tessalonicenses 5:18" },
  { text: "Esforçai-vos, e ele fortalecerá o vosso coração, vós todos que esperais no Senhor.", ref: "Salmos 31:24" },
  { text: "Buscai primeiro o Reino de Deus e a sua justiça, e todas essas coisas vos serão acrescentadas.", ref: "Mateus 6:33" },
  { text: "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e tenha misericórdia de ti.", ref: "Números 6:24-25" },
  { text: "Pois será como a árvore plantada junto a ribeiros de águas, a qual dá o seu fruto na estação própria.", ref: "Salmos 1:3" },
  { text: "Combati o bom combate, acabei a carreira, guardei a fé.", ref: "2 Timóteo 4:7" },
  { text: "Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo.", ref: "Salmos 23:4" },
  { text: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos sentimentos em Cristo Jesus.", ref: "Filipenses 4:7" },
  { text: "Cria em mim, ó Deus, um coração puro e renova em mim um espírito reto.", ref: "Salmos 51:10" },
  { text: "Ora, a fé é o firme fundamento das coisas que se esperam e a prova das coisas que se não veem.", ref: "Hebreus 11:1" },
];

export const DailyVerse = () => {
  const verse = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    return VERSES[dayOfYear % VERSES.length];
  }, []);

  return (
    <div className="w-full px-4 py-1.5 bg-muted/50 border-b flex items-center gap-2 text-xs text-muted-foreground">
      <BookOpen className="h-3 w-3 shrink-0 text-primary" />
      <span className="truncate">
        <span className="italic">"{verse.text}"</span>
        <span className="ml-1.5 font-semibold text-foreground/70">— {verse.ref}</span>
      </span>
    </div>
  );
};
