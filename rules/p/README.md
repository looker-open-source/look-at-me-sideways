<p>The parser rule surfaces errors reported by <code>lookml-parser</code>. <code>P0</code> and <code>P1</code> are enabled by default (unless disabled via <code>rule: P { enabled: no }</code>); schema validation errors (<code>P2</code>–<code>P4</code>) require opting in via <code>rule: P {}</code> in <code>manifest.lkml</code>:</p>
<ul>
	<li id="p0"><b><a href="#p0">P0.</a></b> <code>PARSE_ERROR</code> — Generic parser error other than the specific codes below (enabled by default).</li>
	<li id="p1"><b><a href="#p1">P1.</a></b> <code>SYNTAX_ERROR</code> — LookML syntax error (after expanding any <code>#LAMS</code> conditional comments). Includes a <code>hint</code> with expected syntax context when available (enabled by default).</li>
	<li id="p2"><b><a href="#p2">P2.</a></b> <code>DUPLICATE_SINGULAR_PROPERTY</code> — A singular LookML property was declared more than once in the same block (opt-in via <code>rule: P {}</code>).</li>
	<li id="p3"><b><a href="#p3">P3.</a></b> <code>INVALID_PROPERTY_TYPE</code> — A LookML property value does not match the expected schema type (opt-in via <code>rule: P {}</code>).</li>
	<li id="p4"><b><a href="#p4">P4.</a></b> <code>MISSING_REQUIRED_PROPERTY</code> — A required LookML property is missing from a block (opt-in via <code>rule: P {}</code>).</li>
</ul>
