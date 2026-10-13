'use client';

type Audit=ReturnType<typeof import('../lib/skill-usage').auditSelfBuffSkills>;

export default function SelfBuffHealth({audit}:{audit:Audit}){
  return <section className="health-subsection">
    <h3>Self-buff skill coverage</h3>
    <dl>
      <div><dt>Player-facing self buffs</dt><dd>{audit.totalCandidates}</dd></div>
      <div><dt>Fully supported</dt><dd>{audit.supported.length}</dd></div>
      <div><dt>Partially supported</dt><dd>{audit.partial.length}</dd></div>
      <div><dt>Recognized but unsupported</dt><dd>{audit.unsupported.length}</dd></div>
      <div><dt>Skills with unknown effect parameters</dt><dd>{audit.unknown.length}</dd></div>
    </dl>

    {audit.unknown.length>0&&<details open>
      <summary>Unknown self-buff effects · {audit.unknown.length}</summary>
      {audit.unknown.map(row=><p className="notice" key={row.skillId}>
        <strong>{row.className} · {row.skillName}</strong>
        {' · '}
        {row.unknownParameters.join(', ')}
      </p>)}
    </details>}

    {audit.partial.length>0&&<details>
      <summary>Partial self-buff mechanics · {audit.partial.length}</summary>
      {audit.partial.map(row=><p key={row.skillId}>
        <strong>{row.className} · {row.skillName}</strong>
        {row.notes.length?' · '+row.notes.join(' '):''}
      </p>)}
    </details>}

    <details>
      <summary>Coverage by class · {audit.byClass.length}</summary>
      <dl>{audit.byClass.map(row=><div key={row.classId}>
        <dt>{row.className}</dt>
        <dd>{row.supported} full · {row.partial} partial · {row.unsupported} unsupported</dd>
      </div>)}</dl>
    </details>
  </section>;
}
