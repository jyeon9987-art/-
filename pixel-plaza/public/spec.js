// 아바타 선택지 정의. 브라우저와 서버(검증용)가 같이 쓴다.
const SPEC = {
  options: {
    gender: ['여자', '남자'],
    body: ['마른', '보통', '통통'],
    face: ['기본', '초롱초롱', '웃는 눈', '졸린 눈', '시크', '윙크'],
    hair: ['숏컷', '단발', '긴 머리', '양갈래', '포니테일', '뾰족 머리', '똥머리', '까까머리', '뽀글 머리'],
    top: ['티셔츠', '후드', '줄무늬', '셔츠', '민소매'],
    bottom: ['긴바지', '반바지', '치마', '멜빵바지'],
    acc: ['없음', '안경', '리본', '모자', '꽃', '헤드폰'],
  },
  colors: {
    skin: ['#ffe2cc', '#ffd0b0', '#f2b98f', '#d99a6c', '#a86f47', '#74482c', '#b9e3a8', '#b8c8ff'],
    hairColor: ['#2e2a33', '#5a3a26', '#8f5a32', '#d9a441', '#f2dc8c', '#e8663d', '#ff8fb5', '#8f6bff', '#4aa3ff', '#4fc9a4', '#e9e9f2'],
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
