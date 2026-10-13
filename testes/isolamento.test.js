/**
 * Isolamento: nenhum parceiro ou cliente vê dado de outro (docs/redesenho.md › 9).
 * Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  escopoDe,
  escreverPedido,
  filtrarPorEscopo,
  lerPedido,
  resolverAlcance,
} from '../lib/dados/regras.js';
import { normalizarPerfil, pode } from '../lib/permissoes.js';
import { navegacaoDe, precisaDeCliente } from '../lib/navegacao.js';

const ESTRUTURA = {
  parceiros: [
    { id: 'p1', nome: 'Parceiro Um' },
    { id: 'p2', nome: 'Parceiro Dois' },
  ],
  clientes: [
    { id: 'c1', parceiro_id: 'p1', codigo: 'um', nome: 'Cliente Um' },
    { id: 'c2', parceiro_id: 'p1', codigo: 'dois', nome: 'Cliente Dois' },
    { id: 'c3', parceiro_id: 'p2', codigo: 'tres', nome: 'Cliente Três' },
  ],
  cnpjs: [
    { id: 'c1-m', cliente_id: 'c1', cnpj: '11.111.111/0001-11', tipo: 'matriz' },
    { id: 'c1-f', cliente_id: 'c1', cnpj: '11.111.111/0002-11', tipo: 'filial' },
    { id: 'c3-m', cliente_id: 'c3', cnpj: '33.333.333/0001-33', tipo: 'matriz' },
  ],
};

const LINHAS = [
  { Cliente: 'um', Nome: 'Ana' },
  { Cliente: 'dois', Nome: 'Bruno' },
  { Cliente: 'tres', Nome: 'Carla' },
  { Cliente: 'UM ', Nome: 'Diego' },
];

const gestaoUm = { perfil: 'gestao', cliente: 'um' };
const parceiroUm = { perfil: 'parceiro', parceiro: 'p1' };
const admin = { perfil: 'admin' };

test('gestão fica no próprio cliente, mesmo pedindo outro', () => {
  const alcance = resolverAlcance(gestaoUm, ESTRUTURA, { parceiro: 'p2', cliente: 'c3', cnpj: 'c3-m' });
  assert.equal(alcance.cliente.id, 'c1');
  assert.equal(alcance.parceiro.id, 'p1');
  assert.equal(alcance.cnpj, null, 'CNPJ de outro cliente é ignorado');
  assert.deepEqual(alcance.opcoes.clientes.map((c) => c.id), ['c1']);
});

test('gestão escolhe só CNPJ do próprio cliente', () => {
  const alcance = resolverAlcance(gestaoUm, ESTRUTURA, { cnpj: 'c1-f' });
  assert.equal(alcance.cnpj.id, 'c1-f');
  assert.deepEqual(escopoDe(alcance), { cliente: 'um', cnpj: '11.111.111/0002-11' });
});

test('parceiro não alcança cliente de outro parceiro', () => {
  const alcance = resolverAlcance(parceiroUm, ESTRUTURA, { cliente: 'c3' });
  assert.equal(alcance.cliente, null, 'cai em "todos os clientes", nunca no cliente do outro');
  assert.deepEqual(alcance.opcoes.clientes.map((c) => c.id), ['c1', 'c2']);
  assert.equal(escopoDe(alcance), null, 'sem cliente, as telas de cliente não têm recorte');
});

test('parceiro não troca de parceiro pelo pedido', () => {
  const alcance = resolverAlcance(parceiroUm, ESTRUTURA, { parceiro: 'p2', cliente: 'c2' });
  assert.equal(alcance.parceiro.id, 'p1');
  assert.equal(alcance.cliente.id, 'c2');
  assert.deepEqual(alcance.opcoes.parceiros.map((p) => p.id), ['p1']);
});

test('parceiro sem parceiro válido não vê ninguém', () => {
  const alcance = resolverAlcance({ perfil: 'parceiro', parceiro: 'inexistente' }, ESTRUTURA, { cliente: 'c1' });
  assert.equal(alcance.cliente, null);
  assert.deepEqual(alcance.opcoes.clientes, []);
});

test('administração alcança qualquer parceiro e cliente', () => {
  const alcance = resolverAlcance(admin, ESTRUTURA, { cliente: 'c3' });
  assert.equal(alcance.cliente.id, 'c3');
  assert.equal(alcance.parceiro.id, 'p2', 'o parceiro vem do cliente escolhido');
  const comParceiro = resolverAlcance(admin, ESTRUTURA, { parceiro: 'p1', cliente: 'c3' });
  assert.equal(comParceiro.cliente, null, 'cliente fora do parceiro escolhido é ignorado');
});

test('recorte das linhas devolve só o cliente do escopo', () => {
  const nomes = filtrarPorEscopo(LINHAS, { cliente: 'um' }).map((linha) => linha.Nome);
  assert.deepEqual(nomes, ['Ana', 'Diego']);
  assert.deepEqual(filtrarPorEscopo(LINHAS, null), [], 'sem escopo, nenhuma linha');
  assert.equal(filtrarPorEscopo(LINHAS, { cliente: '*' }).length, LINHAS.length);
});

test('pedido do cookie: ida e volta, e lixo vira "todos"', () => {
  const pedido = { parceiro: 'p1', cliente: 'c2', cnpj: null };
  assert.deepEqual(lerPedido(escreverPedido(pedido)), pedido);
  assert.deepEqual(lerPedido('qualquer coisa'), { parceiro: null, cliente: null, cnpj: null });
  assert.deepEqual(lerPedido(undefined), { parceiro: null, cliente: null, cnpj: null });
});

test('permissões: só a gestão lança e aprova; CID só gestão e administração', () => {
  assert.ok(pode('gestao', 'lancar') && pode('gestao', 'aprovar'));
  for (const perfil of ['parceiro', 'admin']) {
    assert.ok(!pode(perfil, 'lancar'), `${perfil} não lança`);
    assert.ok(!pode(perfil, 'aprovar'), `${perfil} não aprova`);
  }
  assert.ok(pode('gestao', 'ver-cid') && pode('admin', 'ver-cid'));
  assert.ok(!pode('parceiro', 'ver-cid'));
  assert.ok(!pode(undefined, 'lancar'), 'sem perfil, nada');
});

test('perfil: "*" é administração; nomes antigos viram gestão', () => {
  assert.equal(normalizarPerfil('Operador', 'teste'), 'gestao');
  assert.equal(normalizarPerfil('administrador', 'teste'), 'gestao');
  assert.equal(normalizarPerfil('administrador', '*'), 'admin');
  assert.equal(normalizarPerfil('Parceiro', ''), 'parceiro');
});

test('navegação: parceiro e administração não lançam; telas de cliente pedem cliente', () => {
  assert.equal(navegacaoDe('parceiro').lancamentos.length, 0);
  assert.equal(navegacaoDe('admin').podeLancar, false);
  assert.ok(navegacaoDe('gestao').lancamentos.length > 0);
  assert.ok(precisaDeCliente('/colaboradores/MAT001'));
  assert.ok(!precisaDeCliente('/carteira'));
  const semCliente = navegacaoDe('parceiro', { temCliente: false }).grupos.flatMap((g) => g.itens.map((i) => i.id));
  assert.ok(!semCliente.includes('colaboradores'), 'sem cliente, o parceiro não vê telas de cliente no menu');
});

test('navegação: Início e Pendências são da demonstração; fora dela, o início é o painel', () => {
  const itens = (opcoes) => navegacaoDe('gestao', opcoes).grupos.flatMap((g) => g.itens);
  const naDemo = itens({ demonstracao: true });
  assert.equal(naDemo.find((item) => item.id === 'inicio').href, '/inicio');
  assert.ok(naDemo.some((item) => item.id === 'pendencias'));
  const fora = itens({ demonstracao: false });
  assert.equal(fora.find((item) => item.id === 'inicio').href, '/painel');
  assert.ok(!fora.some((item) => item.id === 'pendencias'));
  assert.equal(navegacaoDe('gestao', { demonstracao: false }).barra[0].href, '/painel');
  assert.equal(navegacaoDe('gestao', { demonstracao: false }).inicio, '/painel');
  assert.ok(precisaDeCliente('/inicio') && precisaDeCliente('/pendencias'));
});
