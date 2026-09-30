function toggleFaq(el){
  const item = el.parentElement;
  document.querySelectorAll('.faq-item').forEach(i=>{ if(i!==item) i.classList.remove('open'); });
  item.classList.toggle('open');
}
function submitTicket(){
  document.getElementById('successNote').classList.add('show');
}
