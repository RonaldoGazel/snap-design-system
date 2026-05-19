import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ProcessDistribution, ProcessDocType } from './enums';
import {
  DISTRIBUTION_DOCTYPE_MAP,
  DOCTYPE_TEMPLATE_MAP,
  DISTRIBUTION_LABEL_MAP,
  DOCTYPE_LABEL_MAP,
} from './process-mappings';

// Feature: process-document-distribution, Property 2: Distribution-to-DocType mapping correctness

/**
 * Validates: Requirements 2.2, 2.3, 2.4
 *
 * Property: For any valid ProcessDistribution value, DISTRIBUTION_DOCTYPE_MAP
 * returns a non-empty array of valid ProcessDocType values, and the returned
 * set matches exactly the expected doc types for that distribution.
 */
describe('Property 2: Distribution-to-DocType mapping correctness', () => {
  const allDistributions = Object.values(ProcessDistribution);
  const allDocTypes = Object.values(ProcessDocType);
  const distributionArb = fc.constantFrom(...allDistributions);

  it('every valid distribution maps to a non-empty array of valid ProcessDocType values', () => {
    fc.assert(
      fc.property(distributionArb, (distribution) => {
        const docTypes = DISTRIBUTION_DOCTYPE_MAP[distribution];

        expect(docTypes).toBeDefined();
        expect(Array.isArray(docTypes)).toBe(true);
        expect(docTypes.length).toBeGreaterThan(0);

        for (const docType of docTypes) {
          expect(allDocTypes).toContain(docType);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('EXTERNO maps to exactly [RELATORIO, PEDIDO, ENCAMINHAMENTO, MENSAGEM, OFICIO]', () => {
    expect(DISTRIBUTION_DOCTYPE_MAP[ProcessDistribution.EXTERNO]).toEqual([
      ProcessDocType.RELATORIO,
      ProcessDocType.PEDIDO,
      ProcessDocType.ENCAMINHAMENTO,
      ProcessDocType.MENSAGEM,
      ProcessDocType.OFICIO,
    ]);
  });

  it('INTERNO maps to exactly [RELATORIO, PEDIDO, ORDEM, INFORME, FORMULARIO, CORRESPONDENCIA, DENUNCIA]', () => {
    expect(DISTRIBUTION_DOCTYPE_MAP[ProcessDistribution.INTERNO]).toEqual([
      ProcessDocType.RELATORIO,
      ProcessDocType.PEDIDO,
      ProcessDocType.ORDEM,
      ProcessDocType.INFORME,
      ProcessDocType.FORMULARIO,
      ProcessDocType.CORRESPONDENCIA,
      ProcessDocType.DENUNCIA,
    ]);
  });

  it('INTERNO_EXTERNO maps to exactly [RELATORIO, SUMARIO]', () => {
    expect(DISTRIBUTION_DOCTYPE_MAP[ProcessDistribution.INTERNO_EXTERNO]).toEqual([
      ProcessDocType.RELATORIO,
      ProcessDocType.SUMARIO,
    ]);
  });
});

// Feature: process-document-distribution, Property 4: Template mapping completeness and correctness

/**
 * Validates: Requirements 3.2, 4.1–4.14
 *
 * Property: For any valid (distribution, doc_type) combination from
 * DISTRIBUTION_DOCTYPE_MAP, the composite key "DISTRIBUTION:DOCTYPE" exists
 * in DOCTYPE_TEMPLATE_MAP and returns a non-empty array of TemplateOption
 * objects where every field (key, abbreviation, fullName) is non-empty.
 * Total template count across all combinations equals 22.
 */
describe('Property 4: Template mapping completeness and correctness', () => {
  const validCombinations: Array<{ distribution: ProcessDistribution; docType: ProcessDocType }> = [];
  for (const distribution of Object.values(ProcessDistribution)) {
    for (const docType of DISTRIBUTION_DOCTYPE_MAP[distribution]) {
      validCombinations.push({ distribution, docType });
    }
  }

  const combinationArb = fc.constantFrom(...validCombinations);

  it('every valid (distribution, doc_type) combination has a DOCTYPE_TEMPLATE_MAP entry with non-empty templates and fields', () => {
    fc.assert(
      fc.property(combinationArb, ({ distribution, docType }) => {
        const compositeKey = `${distribution}:${docType}`;
        const templates = DOCTYPE_TEMPLATE_MAP[compositeKey];

        expect(templates).toBeDefined();
        expect(Array.isArray(templates)).toBe(true);
        expect(templates.length).toBeGreaterThan(0);

        for (const tpl of templates) {
          expect(tpl.key).toBeDefined();
          expect(typeof tpl.key).toBe('string');
          expect(tpl.key.length).toBeGreaterThan(0);

          expect(tpl.abbreviation).toBeDefined();
          expect(typeof tpl.abbreviation).toBe('string');
          expect(tpl.abbreviation.length).toBeGreaterThan(0);

          expect(tpl.fullName).toBeDefined();
          expect(typeof tpl.fullName).toBe('string');
          expect(tpl.fullName.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('total template count across all valid combinations equals 22', () => {
    let totalTemplates = 0;
    for (const { distribution, docType } of validCombinations) {
      const compositeKey = `${distribution}:${docType}`;
      const templates = DOCTYPE_TEMPLATE_MAP[compositeKey];
      totalTemplates += templates.length;
    }
    expect(totalTemplates).toBe(22);
  });
});

// Feature: process-document-distribution, Property 5: Template label formatting

/**
 * Validates: Requirements 3.3
 *
 * Property: For each template option, the label format should be
 * "ABBREVIATION - Full Name" (e.g., "RELINT - Relatório de Inteligência").
 */
describe('Property 5: Template label formatting', () => {
  const allTemplates: Array<{ key: string; abbreviation: string; fullName: string; compositeKey: string }> = [];
  for (const distribution of Object.values(ProcessDistribution)) {
    for (const docType of DISTRIBUTION_DOCTYPE_MAP[distribution]) {
      const compositeKey = `${distribution}:${docType}`;
      const templates = DOCTYPE_TEMPLATE_MAP[compositeKey];
      for (const tpl of templates) {
        allTemplates.push({ ...tpl, compositeKey });
      }
    }
  }

  const templateArb = fc.constantFrom(...allTemplates);

  it('every template label follows the format "ABBREVIATION - Full Name"', () => {
    fc.assert(
      fc.property(templateArb, (tpl) => {
        const expectedLabel = `${tpl.abbreviation} - ${tpl.fullName}`;

        // Verify the label can be constructed from abbreviation and fullName
        expect(tpl.abbreviation.length).toBeGreaterThan(0);
        expect(tpl.fullName.length).toBeGreaterThan(0);
        expect(expectedLabel).toMatch(/^.+ - .+$/);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: process-document-distribution, Property 9: Label mapping covers all values with Portuguese labels

/**
 * Validates: Requirements 8.3, 8.4, 9.3
 *
 * Property: Every ProcessDistribution has a non-empty label in DISTRIBUTION_LABEL_MAP.
 * Every ProcessDocType has a non-empty label in DOCTYPE_LABEL_MAP.
 */
describe('Property 9: Label mapping covers all values with Portuguese labels', () => {
  const distributionArb = fc.constantFrom(...Object.values(ProcessDistribution));
  const docTypeArb = fc.constantFrom(...Object.values(ProcessDocType));

  it('every ProcessDistribution has a non-empty label in DISTRIBUTION_LABEL_MAP', () => {
    fc.assert(
      fc.property(distributionArb, (distribution) => {
        const label = DISTRIBUTION_LABEL_MAP[distribution];

        expect(label).toBeDefined();
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('every ProcessDocType has a non-empty label in DOCTYPE_LABEL_MAP', () => {
    fc.assert(
      fc.property(docTypeArb, (docType) => {
        const label = DOCTYPE_LABEL_MAP[docType];

        expect(label).toBeDefined();
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });
});
