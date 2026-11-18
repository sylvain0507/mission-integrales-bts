/* Rendu MathML natif : aucune police ni bibliothèque externe. */
function mathEscape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function mathExpression(source){
 const tokens=String(source).match(/\d+(?:[.,]\d+)?|sin|cos|ln|eff|moy|[A-Za-zÀ-ÿα-ωΑ-Ω]|[^\s]/gu)||[];let p=0;
 const row=xs=>xs.length===1?xs[0]:'<mrow>'+xs.join('')+'</mrow>';
 function atom(){let t=tokens[p++];if(t===undefined)return '<mrow></mrow>';let out;
  if(t==='('||t==='['){const end=t==='('?')':']',inside=expr(end);if(tokens[p]===end)p++;out='<mrow><mo>'+mathEscape(t)+'</mo>'+inside+'<mo>'+end+'</mo></mrow>'}
  else if(t==='√')out='<msqrt>'+atom()+'</msqrt>';
  else if(/^\d/.test(t))out='<mn>'+mathEscape(t)+'</mn>';
  else if(/^[A-Za-zÀ-ÿα-ωΑ-Ω]+$/u.test(t))out='<mi'+(['sin','cos','ln'].includes(t)?' mathvariant="normal"':'')+'>'+mathEscape(t)+'</mi>';
  else out='<mo>'+mathEscape(t==='-'?'−':t)+'</mo>';
  while(['²','³','^','_','′','₀'].includes(tokens[p])){const op=tokens[p++];if(op==='′')out='<msup>'+out+'<mo>′</mo></msup>';else if(op==='₀')out='<msub>'+out+'<mn>0</mn></msub>';else if(op==='²'||op==='³')out='<msup>'+out+'<mn>'+(op==='²'?2:3)+'</mn></msup>';else{let power;if(tokens[p]==='('){p++;power=expr(')');if(tokens[p]===')')p++}else power=atom();out=(op==='_'?'<msub>':'<msup>')+out+power+(op==='_'?'</msub>':'</msup>')}}return out;
 }
 function product(end){let parts=[];while(p<tokens.length&&tokens[p]!==end&&!['+','−','-','='].includes(tokens[p])){if(tokens[p]==='/'){p++;const numerator=row(parts);parts=['<mfrac>'+numerator+atom()+'</mfrac>']}else parts.push(atom())}return row(parts)}
 function expr(end){const parts=[];while(p<tokens.length&&tokens[p]!==end){if(['+','−','-','='].includes(tokens[p])){parts.push('<mo>'+mathEscape(tokens[p++].replace('-','−'))+'</mo>')}else parts.push(product(end))}return row(parts)}
 return expr();
}
function mathWrap(content,label=''){return '<math xmlns="http://www.w3.org/1998/Math/MathML"'+(label?' aria-label="'+mathEscape(label)+'"':'')+'>'+content+'</math>'}
function mathIntegral(lower,upper,integrand){return '<mrow><msubsup><mo>∫</mo>'+mathExpression(lower)+mathExpression(upper)+'</msubsup>'+mathExpression(integrand)+'<mspace width="0.2em"/><mi mathvariant="normal">d</mi><mi>t</mi></mrow>'}
function mathNotation(value){let s=String(value),fragments=[];const keep=html=>'\u0000'+(fragments.push(html)-1)+'\u0000';
 // Cas de la valeur efficace : racine, fraction et intégrale dans une même formule.
 s=s.replace(/I_eff = √\[\(1\/T\) ∫ de 0 à T de i²\(t\) dt\]/g,()=>keep(mathWrap('<mrow><msub><mi>I</mi><mi mathvariant="normal">eff</mi></msub><mo>=</mo><msqrt><mrow><mfrac><mn>1</mn><mi>T</mi></mfrac>'+mathIntegral('0','T','i²(t)')+'</mrow></msqrt></mrow>','I efficace égale la racine carrée de la moyenne du carré du courant')));
 s=s.replace(/∫ de ([^ ]+) à ([^ ]+) de (.+?) dt/g,(_,a,b,f)=>keep(mathWrap(mathIntegral(a,b,f),`Intégrale de ${a} à ${b} de ${f} par rapport à t`)));
 s=s.replace(/∫₀² ([^ ]+) dt/g,(_,f)=>keep(mathWrap(mathIntegral('0','2',f))));
 s=s.replace(/∫₂⁵ ([^ ]+) dt/g,(_,f)=>keep(mathWrap(mathIntegral('2','5',f))));
 s=s.replace(/\[([^\[\]]+)\] de 0 à ([^ ,;.]+)/g,(_,f,b)=>keep(mathWrap('<mrow><msubsup><mrow><mo>[</mo>'+mathExpression(f)+'<mo>]</mo></mrow><mn>0</mn>'+mathExpression(b)+'</msubsup></mrow>')));
 s=s.replace(/e\^\(([^()]+)\)/g,(_,power)=>keep(mathWrap('<msup><mi mathvariant="normal">e</mi>'+mathExpression(power)+'</msup>')));
 s=s.replace(/(?:\d+|[A-Za-zωτ])\/\(t \+ 1\)(?:²)?/g,f=>keep(mathWrap(mathExpression(f))));
 s=s.replace(/(?:−?[A-Za-z]|−?\d+(?:[.,]\d+)?|[A-Za-z]²)\/(?:√2|\d+|[A-Za-zωτ])/g,f=>keep(mathWrap(mathExpression(f))));
 s=s.replace(/I_(eff|moy)/g,(_,sub)=>keep(mathWrap('<msub><mi>I</mi><mi mathvariant="normal">'+sub+'</mi></msub>')));
 return mathEscape(s).replace(/\u0000(\d+)\u0000/g,(_,i)=>fragments[Number(i)]);
}
function plainMath(s){const sup={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','−':'⁻','-':'⁻','+':'⁺','t':'ᵗ','/':'⁄'};return String(s).replace(/e\^\(([^()]+)\)/g,(_,power)=>'e'+Array.from(power,c=>sup[c]||c).join('')).replace(/I_eff/g,'Iₑff').replace(/I_moy/g,'Iₘₒᵧ');}
