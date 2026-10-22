import re
from .models import Fact,Rule

def inspect(content):
 findings=[]
 for rule in Rule.objects.all():
  for m in re.finditer(re.escape(rule.phrase),content,re.I):
   findings.append(dict(kind='prohibited_term',excerpt=m.group(),reason=rule.explanation,suggestion=rule.replacement or 'Ask reviewer for approved wording',source=f'{rule.code}: {rule.source}'))
 # Demonstration checks use explicit fact keys, e.g. 'savings rate'. No invented semantic extraction.
 for fact in Fact.objects.filter(status='approved'):
  key=fact.key.strip()
  # Match a fact key followed by an optional linking verb and a numeric value.
  pattern=rf'\b{re.escape(key)}\b\s*(?:is|of|:|=|at)?\s*(\d+(?:\.\d+)?\s*%?)'
  for m in re.finditer(pattern,content,re.I):
   observed=re.sub(r'\s+','',m.group(1)); expected=re.sub(r'\s+','',fact.value)
   if observed!=expected:
    findings.append(dict(kind='fact_mismatch',excerpt=m.group(),reason=f'Current approved {key} is {fact.value}; draft states {m.group(1)}.',suggestion=f'{key} is {fact.value}',source=f'{fact.key}: {fact.source}'))
 return findings
