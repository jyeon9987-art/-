// 아바타 선택지 정의. 브라우저와 서버(검증용)가 같이 쓴다.
const SPEC = {
  options: {
    gender: ['여자', '남자'],
    body: ['마른', '보통', '통통'],
    face: ['기본', '초롱초롱', '웃는 눈', '졸린 눈', '시크', '윙크'],
    hair: ['숏컷', '단발', '긴 머리', '양갈래', '포니테일', '뾰족 머리', '똥머리', '까까머리', '뽀글 머리', '만두 머리', '웨이브'],
    top: ['티셔츠', '후드', '줄무늬', '셔츠', '민소매', '세일러복', '가디건', '프릴 블라우스', '교복 재킷', '케이프'],
    bottom: ['긴바지', '반바지', '치마', '멜빵바지', '주름치마', '프릴 치마', '호박 바지', '롱스커트'],
    shoes: ['운동화', '부츠', '메리제인', '니삭스', '줄무늬 양말', '노란 장화'],
    acc: ['없음', '안경', '리본', '모자', '꽃', '헤드폰', '고양이 귀', '토끼 귀', '천사 링', '왕관', '베레모', '마녀 모자', '꼬마 뿔', '곰돌이 귀'],
    back: ['없음', '천사 날개', '악마 날개', '나비 날개', '책가방', '여우 꼬리', '고양이 꼬리'],
    hand: ['없음', '풍선', '막대사탕', '별 요술봉', '곰인형'],
  },
  colors: {
    skin: ['#ffe2cc', '#ffd0b0', '#f2b98f', '#d99a6c', '#a86f47', '#74482c', '#b9e3a8', '#b8c8ff'],
    eyeColor: ['#3a2a40', '#7a4a2a', '#3f7fe0', '#2fa37a', '#8f5bd6', '#e0557f', '#e08a2a', '#6b7a90'],
    hairColor: ['#2e2a33', '#5a3a26', '#8f5a32', '#d9a441', '#f2dc8c', '#e8663d', '#ff8fb5', '#8f6bff', '#4aa3ff', '#4fc9a4', '#e9e9f2', '#b8f0c0'],
    topColor: ['#ffffff', '#ff6b6b', '#ff9f43', '#ffd93d', '#6bcb77', '#2fb8a0', '#4d96ff', '#5b5bd6', '#b06bff', '#ff8fc7', '#8d99ae', '#33313b'],
    bottomColor: ['#33313b', '#3b5b92', '#6c8ed4', '#8d6e53', '#d9c2a0', '#ffffff', '#ff6b6b', '#ff8fc7', '#6bcb77', '#b06bff', '#ffd93d', '#8d99ae'],
  },
};

function specValidate(av) {
  if (!av || typeof av !== 'object') return null;
  const out = {};
  for (const group of [SPEC.options, SPEC.colors]) {
    for (const key of Object.keys(group)) {
      const v = av[key];
      if (!Number.isInteger(v) || v < 0 || v >= group[key].length) return null;
      out[key] = v;
    }
  }
  return out;
}

if (typeof module !== 'undefined') module.exports = { SPEC, specValidate };
