import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';

const html=readFileSync(new URL('../oddechove-hry/prsi.html',import.meta.url),'utf8');
const gallery=readFileSync(new URL('../oddechove-hry/index.html',import.meta.url),'utf8');
const version=JSON.parse(readFileSync(new URL('../oddechove-hry/prsi-version.json',import.meta.url),'utf8'));

const start=html.indexOf('const engine = (() => {');
const end=html.indexOf('// ENGINE END',start);
assert.ok(start>0&&end>start,'Hra obsahuje pravidla');
const engine=runInNewContext(html.slice(start,end)+'\nengine;',{});

test('Prší je čtvrtá oddechová hra a navigace zůstává funkční',()=>{
  assert.equal((gallery.match(/<article class="game">/g)||[]).length,4);
  assert.match(gallery,/href="\.\/prsi\.html"/);
  assert.match(gallery,/src="\.\/prsi\.svg"/);
  assert.match(html,/href="\.\/" aria-label="Zpět na oddechové hry"/);
});

test('Webová verze má správně doplněný Scriptable HTML kód',()=>{
  const from=html.indexOf('<script>'),to=html.indexOf('</script>',from);
  assert.ok(from>0&&to>from);
  assert.doesNotThrow(()=>new Script(html.slice(from+'<script>'.length,to)));
  assert.doesNotMatch(html,/__INITIAL_STATE__|__APP_VERSION__|__VERSION_URL__/);
  assert.match(html,/localStorage\.getItem\('prsi_deluxe_v1'\)/);
  assert.match(html,/localStorage\.setItem\('prsi_deluxe_v1'/);
  assert.match(html,/\.hand \.playing-card:disabled\{opacity:1;/);
  assert.match(html,/id="checkUpdatesButton"/);
  assert.equal(version.version,'0.1.1');
});

test('Balíček obsahuje 32 karet a na začátku má každý čtyři',()=>{
  for(let round=0;round<30;round++){
    const game=engine.start();
    assert.equal(game.stock.length,23);
    assert.equal(game.hands[0].length,4);
    assert.equal(game.hands[1].length,4);
    assert.equal(new Set(engine.deck().map(card=>card.id)).size,32);
  }
});

test('Trest sedmiček se sčítá a eso lze přebít',()=>{
  const cards=engine.deck();
  const byId=id=>cards.find(card=>card.id===id);
  const game={stock:cards.filter(c=>!['hearts-7','bells-7','hearts-8','acorns-A','leaves-A'].includes(c.id)),
    discard:[byId('hearts-8')],hands:[[byId('hearts-7'),byId('acorns-A')],[byId('bells-7'),byId('leaves-A')]],
    current:0,activeSuit:'hearts',pending:null,winner:null,history:[]};
  assert.equal(engine.play(game,0,'hearts-7'),true);
  assert.equal(engine.play(game,1,'bells-7'),true);
  assert.equal(game.pending.count,4);
  assert.equal(engine.draw(game,0).count,4);
  assert.equal(game.pending,null);
  assert.equal(game.current,1);
});

test('Počítač umí desítky kompletních partií bez ztráty karet',()=>{
  for(let round=0;round<35;round++){
    const game=engine.start(Math.random,round%2);
    for(let turn=0;game.winner===null&&turn<1700;turn++){
      const player=game.current;
      const move=player===1?engine.aiMove(game,'hard'):(()=>{
        const playable=engine.legal(game,0);
        if(!playable.length)return {type:'draw'};
        const card=playable[0];
        return {type:'play',id:card.id,chosenSuit:card.rank==='O'?engine.bestSuit(game.hands[0].filter(c=>c.id!==card.id)):null};
      })();
      if(move.type==='play')assert.equal(engine.play(game,player,move.id,move.chosenSuit),true);
      else assert.ok(engine.draw(game,player));
      const all=[...game.stock,...game.discard,...game.hands[0],...game.hands[1]];
      assert.equal(all.length,32);
    }
    assert.ok(game.winner===0||game.winner===1);
  }
});
