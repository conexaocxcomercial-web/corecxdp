/**
 * Ícones que a fonte baixa. O Google Fonts entrega só estes glifos
 * (alguns KB em vez de 5 MB): ao usar um ícone novo, acrescente o nome
 * aqui, senão ele aparece como palavra. Em desenvolvimento, o Icone
 * avisa no console quando o nome não está na lista.
 */
export const ICONES = [
  'add', 'arrow_back', 'arrow_forward', 'badge', 'chat', 'check', 'checklist',
  'chevron_right', 'clinical_notes', 'close', 'contrast', 'dark_mode', 'domain', 'error', 'event',
  'event_available', 'event_busy', 'expand_more', 'group', 'group_add', 'healing',
  'history', 'home', 'hourglass_empty', 'inbox', 'info', 'keep', 'keyboard_capslock',
  'left_panel_close', 'light_mode', 'login', 'logout', 'mail', 'menu', 'monitoring',
  'person_add', 'schedule', 'search', 'search_off', 'sentiment_satisfied',
  'supervisor_account', 'swap_horiz', 'task_alt', 'trending_down', 'trending_flat',
  'trending_up', 'visibility', 'visibility_off', 'warning', 'work',
];

/* Eixos fixos nos valores do globals.css (FILL 0, wght 400, GRAD 0,
   opsz 20); o Google exige os nomes em ordem alfabética. */
export const FONTE_DE_ICONES =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20,400,0,0' +
  `&icon_names=${[...ICONES].sort().join(',')}&display=block`;

/** Material Symbols Rounded, o mesmo conjunto das outras telas do core.cx. */
export function Icone({ nome, tamanho, className = '', ...props }) {
  if (process.env.NODE_ENV !== 'production' && !ICONES.includes(nome)) {
    console.warn(`Ícone "${nome}" fora da lista em componentes/Icones.jsx: acrescente-o em ICONES.`);
  }

  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={tamanho ? { fontSize: `${tamanho}px` } : undefined}
      aria-hidden="true"
      {...props}
    >
      {nome}
    </span>
  );
}
