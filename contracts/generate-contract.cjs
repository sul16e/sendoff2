// 단시간근로자 근로계약서 생성 스크립트 (docx)
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, HeadingLevel, VerticalAlign,
} = require('docx');
const fs = require('fs');

const FONT = '맑은 고딕';
const CONTENT_WIDTH = 9026; // A4, 1인치 여백 기준 본문 폭 (DXA)

const run = (text, opts = {}) =>
  new TextRun({ text, font: FONT, size: opts.size || 21, bold: !!opts.bold, color: opts.color });

const para = (text, opts = {}) =>
  new Paragraph({
    alignment: opts.align,
    spacing: { before: opts.before ?? 60, after: opts.after ?? 60, line: 300 },
    indent: opts.indent,
    children: Array.isArray(text) ? text : [run(text, opts)],
  });

const clauseTitle = (text) => para(text, { bold: true, before: 200, after: 80 });

const cell = (text, width, opts = {}) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [para(text, { align: opts.align || AlignmentType.CENTER, bold: opts.bold, before: 20, after: 20 })],
  });

// 근로일별 근로시간 표
const schedCols = [1400, 1900, 1900, 2100, 1726];
const schedule = new Table({
  width: { size: CONTENT_WIDTH, type: WidthType.DXA },
  columnWidths: schedCols,
  rows: [
    new TableRow({
      children: ['근로일', '시업 시각', '종업 시각', '휴게시간', '실근로시간']
        .map((t, i) => cell(t, schedCols[i], { bold: true })),
    }),
    new TableRow({
      children: ['금요일', '17시 30분', '21시 30분', '없음', '4시간']
        .map((t, i) => cell(t, schedCols[i])),
    }),
    new TableRow({
      children: ['토요일', '17시 30분', '21시 30분', '없음', '4시간']
        .map((t, i) => cell(t, schedCols[i])),
    }),
    new TableRow({
      children: ['일요일', '18시 30분', '21시 30분', '없음', '3시간']
        .map((t, i) => cell(t, schedCols[i])),
    }),
  ],
});

// 사회보험 적용 표시
const insurance = para('☑ 산재보험      ☑ 고용보험 (3개월 이상 계속 근무 시 적용)      ☐ 국민연금      ☐ 건강보험', { before: 40 });

// 서명란 표
const signCols = [1500, 7526];
const signRow = (label, lines) =>
  lines.map((l, i) =>
    new TableRow({
      children: [
        cell(i === 0 ? label : '', signCols[0], { bold: true }),
        cell(l, signCols[1], { align: AlignmentType.LEFT }),
      ],
    }));

const signature = new Table({
  width: { size: CONTENT_WIDTH, type: WidthType.DXA },
  columnWidths: signCols,
  rows: [
    ...signRow('사업주', [
      '사업체명 :                                         (전화 :                              )',
      '주  소 :',
      '대 표 자 :  이  설                                                        (서명)',
    ]),
    ...signRow('근로자', [
      '주  소 :',
      '연 락 처 :',
      '성  명 :  안 유 정                                                       (서명)',
    ]),
  ],
});

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [run('단시간근로자 근로계약서', { size: 36, bold: true })],
      }),
      para('이설(이하 "사업주"라 함)과 안유정(이하 "근로자"라 함)은 다음과 같이 근로계약을 체결한다.', { before: 120, after: 160 }),

      clauseTitle('1. 근로개시일'),
      para('2026년 7월 17일부터 (기간의 정함이 없는 근로계약)', { indent: { left: 300 } }),

      clauseTitle('2. 근무 장소'),
      para('사업주가 운영하는 사업장 :                                                              ', { indent: { left: 300 } }),

      clauseTitle('3. 업무의 내용'),
      para('홀서빙 및 매장관리, 주방보조, 음료 제조 및 판매', { indent: { left: 300 } }),

      clauseTitle('4. 근로일 및 근로일별 근로시간'),
      schedule,
      para('※ 1주 소정근로시간: 11시간', { before: 100, indent: { left: 300 } }),

      clauseTitle('5. 임금'),
      para('① 시간급 : 11,000원', { indent: { left: 300 } }),
      para('② 상여금 : 없음', { indent: { left: 300 } }),
      para('③ 기타 급여(제수당 등) : 없음', { indent: { left: 300 } }),
      para('④ 초과근로에 대한 가산임금률 : 소정근로시간을 초과하여 근로하는 경우 통상임금의 100분의 50을 가산하여 지급한다.', { indent: { left: 300 } }),
      para('⑤ 임금 지급일 : 매월 10일 (전월 1일부터 말일까지의 근로에 대한 임금. 지급일이 휴일인 경우 그 전일에 지급한다.)', { indent: { left: 300 } }),
      para('⑥ 지급 방법 : 근로자 명의 예금통장에 입금', { indent: { left: 300 } }),

      clauseTitle('6. 주휴일·연차유급휴가·퇴직급여'),
      para('근로자의 1주 소정근로시간이 15시간 미만이므로, 근로기준법 제18조제3항 및 근로자퇴직급여 보장법 제4조제1항에 따라 주휴일(주휴수당), 연차유급휴가 및 퇴직급여 규정은 적용되지 아니한다.', { indent: { left: 300 } }),

      clauseTitle('7. 특약사항'),
      para('① 2026년 7월 17일(금)은 예외적으로 13시 30분부터 19시 30분까지 근무한 것으로 하며(실근로 6시간), 해당 근로에 대한 임금은 제5조에 따라 지급한다.', { indent: { left: 300 } }),
      para('② 공휴일·명절 등 사업장 운영상 필요한 경우, 사업주와 근로자가 사전에 합의하여 근로일 또는 근로시간을 추가할 수 있다. 추가된 근로에 대한 임금은 시간급을 기준으로 지급하되, 소정근로시간을 초과하는 부분에 대하여는 제5조 ④항에 따라 가산하여 지급한다.', { indent: { left: 300 } }),

      clauseTitle('8. 사회보험 적용 여부 (해당란에 체크)'),
      insurance,
      para('※ 1주 소정근로시간 15시간(월 60시간) 미만 근로자로서 국민연금·건강보험 직장가입 대상에서 제외된다.', { indent: { left: 300 } }),

      clauseTitle('9. 근로계약서 교부'),
      para('사업주는 근로계약을 체결함과 동시에 본 계약서를 사본하여 근로자의 교부 요구와 관계없이 근로자에게 교부한다. (근로기준법 제17조)', { indent: { left: 300 } }),

      clauseTitle('10. 기타'),
      para('이 계약에 정함이 없는 사항은 근로기준법령에 의한다.', { indent: { left: 300 } }),

      para('2026년 7월 18일', { align: AlignmentType.CENTER, before: 400, after: 300 }),
      signature,
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(__dirname + '/근로계약서_안유정.docx', buf);
  console.log('written');
});
