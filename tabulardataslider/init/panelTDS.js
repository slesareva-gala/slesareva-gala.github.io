// настройка вывода panelAlbum

let panelTDS = {

  columns: [
    { id: 'name',
      width: 150,     
      block:  x=>( ( x.fixed ? String.fromCodePoint(0x1F4CC)+' ' : '')+x.name ),
      heading:'Название',
    },
    { id: 'display',
      width: 90,     
      block:  x=>(  x.display ? String.fromCharCode(10004) : String.fromCharCode(8212)  ),
      css:    'isOut', 
      when: x=>{ x.display = !x.display; panelRe(); return false; },
      renew: [ x=>(x.display), 1],
      heading:'Показывать',
    },
  ],
};

