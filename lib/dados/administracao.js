import * as demo from '@/lib/demo/fonte';
import { alcanceAtual } from '@/lib/dados/alcance';
import { listarUsuarios } from '@/lib/dados/usuarios';
import { AvisoAoUsuario } from '@/lib/avisos';
import { PERFIS, pode } from '@/lib/permissoes';
import { resumoDaCarteira } from '@/lib/carteira';
import { coresDoParceiro } from '@/lib/contraste';
import { encargosDaEmpresa } from '@/lib/folha';

/**
 * Repositório da Administração da plataforma (fase 16 do redesenho):
 * parceiros (com a checagem do white-label), clientes (com o que pede
 * suporte), usuários e a lista de suporte. Só leitura: criar parceiros,
 * empresas e usuários chega com o Supabase. Só na demonstração.
 */
export async function lerAdministracao() {
  const alcance = await alcanceAtual();
  if (!alcance?.demonstracao || !pode(alcance.perfil, 'administrar')) throw new AvisoAoUsuario('A Administração é da plataforma.');
  const dados = demo.dadosCompletos();
  const usuarios = (await listarUsuarios()).map((usuario) => ({ ...usuario, perfilNome: PERFIS[usuario.perfil] || usuario.perfil }));
  const { clientes: resumos } = resumoDaCarteira(dados, dados.clientes, 'nome');
  const porCliente = new Map(resumos.map((item) => [item.id, item]));
  const parceiroPorId = new Map(dados.parceiros.map((parceiro) => [parceiro.id, parceiro]));

  const clientes = dados.clientes.map((cliente) => {
    const resumo = porCliente.get(cliente.id);
    const encargos = encargosDaEmpresa(cliente);
    const usuariosDoCliente = usuarios.filter((usuario) => usuario.cliente.toLowerCase() === cliente.codigo.toLowerCase());
    const suporte = [
      resumo.emRevisao ? 'implantação em revisão' : null,
      encargos.aviso || null,
      usuariosDoCliente.length === 0 ? 'sem usuário da Gestão' : null,
      resumo.vencidos ? `${resumo.vencidos} ${resumo.vencidos === 1 ? 'prazo vencido' : 'prazos vencidos'}` : null,
    ].filter(Boolean);
    return {
      ...resumo,
      parceiro: parceiroPorId.get(cliente.parceiro_id)?.nome || '—',
      parceiro_id: cliente.parceiro_id,
      anexo: cliente.anexo_simples || null,
      percentual: encargos.percentual,
      origemDoPercentual: encargos.origem,
      implantacao: cliente.implantacao || null,
      usuarios: usuariosDoCliente.length,
      suporte,
    };
  });

  const parceiros = dados.parceiros.map((parceiro) => {
    const doParceiro = clientes.filter((cliente) => cliente.parceiro_id === parceiro.id);
    const marca = coresDoParceiro(parceiro.cores);
    return {
      id: parceiro.id,
      nome: parceiro.nome,
      ficticio: parceiro.ficticio,
      clientes: doParceiro.length,
      pessoas: doParceiro.reduce((soma, cliente) => soma + cliente.pessoas, 0),
      usuarios: usuarios.filter((usuario) => usuario.perfil === 'parceiro' && usuario.parceiro === parceiro.id).length,
      cores: parceiro.cores || null,
      marca: parceiro.cores ? (marca.aplicar ? 'cores próprias' : `marca padrão: ${marca.motivo}`) : 'marca padrão',
      checagens: marca.checagens,
    };
  });

  const suporte = [
    ...clientes.filter((cliente) => cliente.suporte.length).map((cliente) => ({ tipo: 'cliente', id: cliente.id, nome: cliente.nome, parceiro: cliente.parceiro, parceiro_id: cliente.parceiro_id, motivos: cliente.suporte })),
    ...parceiros.filter((parceiro) => parceiro.cores && parceiro.marca !== 'cores próprias').map((parceiro) => ({ tipo: 'parceiro', id: parceiro.id, nome: parceiro.nome, motivos: [parceiro.marca] })),
  ];

  return {
    parceiros,
    clientes,
    usuarios: usuarios.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    suporte,
    numeros: {
      parceiros: parceiros.length,
      clientes: clientes.length,
      pessoas: clientes.reduce((soma, cliente) => soma + cliente.pessoas, 0),
      usuarios: usuarios.length,
      porPerfil: Object.fromEntries(Object.keys(PERFIS).map((perfil) => [perfil, usuarios.filter((usuario) => usuario.perfil === perfil).length])),
    },
  };
}
