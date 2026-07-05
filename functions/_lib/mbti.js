// MBTI trait summaries and compatibility helpers shared by Pages Functions.

export const MBTI_TYPES = {
  INTJ: { name: "建築家", group: "分析家", traits: "戦略的・独立志向。深い会話や知的な挑戦を好み、非効率なプランや空気を読むだけの雑談は苦手。" },
  INTP: { name: "論理学者", group: "分析家", traits: "好奇心旺盛で理論好き。新しい知識や自由な発想を刺激される体験を好み、束縛されるスケジュールは苦手。" },
  ENTJ: { name: "指揮官", group: "分析家", traits: "目標志向でリーダー気質。成果や成長を感じられるアクティブなデートを好む。" },
  ENTP: { name: "討論者", group: "分析家", traits: "議論好きで刺激を求める。新奇性・即興性のあるプランを好み、単調な繰り返しは退屈しやすい。" },
  INFJ: { name: "提唱者", group: "外交官", traits: "深い意味や共感を大事にする。静かで意味のある1対1の時間を好む。" },
  INFP: { name: "仲介者", group: "外交官", traits: "理想主義で感受性が豊か。芸術・自然・物語性のある体験に惹かれる。" },
  ENFJ: { name: "主人公", group: "外交官", traits: "人の成長やつながりを大切にする。相手を喜ばせる企画やイベントを好む。" },
  ENFP: { name: "運動家", group: "外交官", traits: "自由で情熱的。新しい場所や人との出会い、驚きのある体験を好む。" },
  ISTJ: { name: "管理者", group: "番人", traits: "責任感が強く堅実。計画通りに進む安定したデートや伝統的な過ごし方を好む。" },
  ISFJ: { name: "擁護者", group: "番人", traits: "思いやり深く献身的。相手を気遣う穏やかで安心できる時間を好む。" },
  ESTJ: { name: "幹部", group: "番人", traits: "実務的で組織的。効率よく計画された、成果の見えるプランを好む。" },
  ESFJ: { name: "領事", group: "番人", traits: "社交的で協調的。みんなで楽しめるイベントや伝統行事を好む。" },
  ISTP: { name: "巨匠", group: "探検家", traits: "実践的でクール。体を動かすアクティビティやDIY的な挑戦を好む。" },
  ISFP: { name: "冒険家", group: "探検家", traits: "自由でマイペース。美的センスを刺激される、縛られない体験を好む。" },
  ESTP: { name: "起業家", group: "探検家", traits: "行動的でスリル志向。アウトドアやスポーツなど五感を刺激するデートを好む。" },
  ESFP: { name: "エンターテイナー", group: "探検家", traits: "陽気で社交的。楽しく賑やかなイベントや即興的な外出を好む。" },
};

const GROUP_PAIR_NOTES = {
  "分析家-分析家": "知的な議論や目標達成を一緒に楽しめる反面、感情面のケアを意識すると良い相性。",
  "分析家-外交官": "分析家の論理と外交官の共感が補い合う組み合わせ。相手のペースへの配慮がカギ。",
  "分析家-番人": "計画性は合うが、分析家の自由さと番人の几帳面さの調整が必要。",
  "分析家-探検家": "刺激的だが価値観の違いが出やすい。新しい体験を通じて歩み寄れる。",
  "外交官-外交官": "感情の共鳴が強く深い絆を築きやすいが、現実的な計画も意識すると良い。",
  "外交官-番人": "外交官の理想と番人の安定志向が補完し合う。安心感のある関係になりやすい。",
  "外交官-探検家": "外交官の情熱と探検家の自由さが刺激し合う、変化に富む相性。",
  "番人-番人": "価値観が一致しやすく安定した関係。たまに新しい刺激を取り入れると◎。",
  "番人-探検家": "番人の計画性と探検家の即興性が対照的。役割分担がうまくいくと好相性。",
  "探検家-探検家": "一緒に楽しむエネルギーが強い。長期的な計画は意識して立てると良い。",
};

export function normalizePair(mbtiA, mbtiB) {
  const a = mbtiA.toUpperCase();
  const b = mbtiB.toUpperCase();
  return [a, b].sort().join("_");
}

export function getCompatibilityNote(mbtiA, mbtiB) {
  const a = MBTI_TYPES[mbtiA.toUpperCase()];
  const b = MBTI_TYPES[mbtiB.toUpperCase()];
  if (!a || !b) return "";
  const key1 = `${a.group}-${b.group}`;
  const key2 = `${b.group}-${a.group}`;
  return GROUP_PAIR_NOTES[key1] || GROUP_PAIR_NOTES[key2] || "";
}

export function describeType(mbti) {
  const t = MBTI_TYPES[mbti?.toUpperCase()];
  if (!t) return `${mbti}: 情報なし`;
  return `${mbti}(${t.name}/${t.group}): ${t.traits}`;
}

export const ALL_MBTI_CODES = Object.keys(MBTI_TYPES);
