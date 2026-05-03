export const accountEquityCsvImportExamples = {
  validCanonical: `date,equity,percentChange
2026-05-01,100000,0
2026-05-02,100350,0.35`,
  headerAliases: `Date,Equity,% Change
2026-05-01,"100,000",0
2026-05-02,"$100,350.00",+0.35%`,
  blankRowsAndPercentFormats: `date,equity,pctChange

2026-05-01,100000,0.35%
2026-05-02,99800,-0.20%`,
  invalidRows: `date,equity,percentChange
,100000,0.1
2026-02-30,100200,0.2
2026-05-03,not-a-number,0.3
2026-05-04,-100,0.4
2026-05-05,100500,`,
  duplicateDates: `date,equity,percentChange
2026-05-01,100000,0
2026-05-01,100100,0.1`,
  outOfOrderRows: `date,equity,percentChange
2026-05-02,100350,0.35
2026-05-01,100000,0`,
  unexpectedColumns: `date,equity,percentChange,notes
2026-05-01,100000,0,Opening balance`,
  malformedUnquotedComma: `date,equity,percentChange
2026-05-01,$100,000.50,0.35`
} as const;
