<p>Wrap a view's identifying dimensions (ID, name, etc) in square brackets to visually distinguish them and hoist them to the top of the field picker. This may be done either directly on the dimension's label, or on a group label.</p>
<p><b>Rationale:</b> This provides a visual hint to explore users about the subject and structure of each view.</p>
<p>For views without primary keys or identifiers, there are no fields to hoist. If a view declares 0 primary keys via a <a href="#k1">pk-naming convention</a>, LAMS will not require any hoisting.</p>
<p><b>Note: </b>LAMS will not identify <i>which</i> fields should be hoisted, just suggest that some should be hoisted when none are found.</p>
<p><b>Note: </b>LAMS configuration can specify different prefixes/sufixes to use instead of the suggested square brackets by specifying the desired characters in </code>prefix</code> and <code>suffix</code> options. Simply make sure to use a prefix that sorts higher than other typically used characters</p>
<code class="block">
# Providing a custom format in manifest.lkml

#LAMS
#rule: H1 {options: {prefix: " 🔑" suffix: ""}}
</code>
