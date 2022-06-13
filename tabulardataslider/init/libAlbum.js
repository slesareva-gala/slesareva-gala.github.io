<<<<<<< HEAD
﻿// настройка вывода libAlbum

let defineAlbum = {

  strip: 16, // полосы LevelGaugeXY: 0 - нет, > 0 - ширина полос
  grid: 2,   // сетка таблицы: 0 - нет, > 0 - сетка
  fixed: 1,   // количество зафиксированных слева столбцов: 0 - нет 
  rowHeight: 140,     // высота строки, по умолчанию: 22 (0-нет строк)
  headingHeight: 60, // высота заголовка, по умолчанию: 22 (0-нет заголовка)
  footingHeight: 24, // высота подвала, по умолчанию: 0 (0-нет подвала)

  lgxy: {  // настройки объекта класса LevelGaugeXY
    locationX:'top',   
    dependX: 'directly', 
    locationY:'left',  
    dependY: 'directly', 
    colorXY: 'rgba(100,100,100,0.7)',
    colorLevel: 'rgba(220,220,220,0.9)',
  },

  columns: [
    { id: 'data.name',
      width: 220,     
      widthMin: 20,   
      widthMax: 800,   
      when: x=>( true ),
      css: 'data_name',
      headingCSS: 'head_data_name',
      heading:'Наименование',
      footing: 'количество: '+( tdsdata ? tdsdata.length : ''),
      footingCSS: 'foot_data_name',
    },
    { id: 'data.short_name',
      width: 160,     
      widthMin: 20,   
      widthMax: 530,   
      when: x=>( true ),
      heading:'Аббревиатура <br />или официальное краткое наименование',
    },
    { id: 'data.used_name',
      hidden: true, 
      width: 120,
      widthMin: 20,   
      widthMax: 200,   
      block:  'data.used_name',
      when: x=>( true ),
      heading: 'Общепринятое наименование',
    },
    { id: 'data.official_name',
      hidden: true, 
      width: 120,
      widthMin: 20,   
      widthMax: 600,   
      when: x=>( true ),
      heading: 'Официальное наименование',
    },
    { id: 'data.form_of_ownership',
      hidden: true, 
      width: 130,
      widthMin: 20,   
      widthMax: 200,   
      when: x=>( true ),
      heading: 'Организационно-правовая форма',
    },
    { id: 'data.category_institutions',
      width: 100,
      widthMin: 20,   
      widthMax: 145,   
      when: x=>( true ),
      heading: 'Категория учреждения',
    },
    { id: 'data.curator_at_ministry_of_culture',
      hidden: true, 
      width: 100,
      widthMin: 20,   
      widthMax: 145,   
      when: x=>( true ),
      heading: 'Куратор в Минкультуры России',
    },
    { id: 'data.cat',
      hidden: true, 
      width: 180,
      widthMin: 20,   
      block: x=>('ИНН: &nbsp; &nbsp; &nbsp;'+x['data.inn']+'<br />'
                +'КПП: &nbsp; &nbsp; &nbsp;'+x['data.cat']+'<br />'
                +'ОГРН: &nbsp; &nbsp;'+x['data.psrn']+'<br />'
                +'КОПУК: '+x['data.kopuk'] ),
      heading: 'ИНН<br />КПП, ОГРН<br />КОПУК',
    },
    { id: 'data.address',
      width: 120,
      widthMin: 20,   
      widthMax: 500,   
      block: x=>('<span style="color:blue;">&#x2709;</span> '+x['data.address']+'<br />'
                +'<span style="color:blue;">&#x2706;</span> '+x['data.phone_number'] ),
      heading: 'Адрес, телефон',
    },
    { id: 'data.website_address',
      width: 150,
      widthMin: 20,   
      widthMax: 145,   
      when: x=>( true ),
      heading: 'Адрес сайта',
    },
  ],
};

=======
﻿// настройка вывода libAlbum

let defineAlbum = {

  strip: 16, // полосы LevelGaugeXY: 0 - нет, > 0 - ширина полос
  grid: 2,   // сетка таблицы: 0 - нет, > 0 - сетка
  fixed: 1,   // количество зафиксированных слева столбцов: 0 - нет 
  rowHeight: 140,     // высота строки, по умолчанию: 22 (0-нет строк)
  headingHeight: 60, // высота заголовка, по умолчанию: 22 (0-нет заголовка)
  footingHeight: 24, // высота подвала, по умолчанию: 0 (0-нет подвала)

  lgxy: {  // настройки объекта класса LevelGaugeXY
    locationX:'top',   
    dependX: 'directly', 
    locationY:'left',  
    dependY: 'directly', 
    colorXY: 'rgba(100,100,100,0.7)',
    colorLevel: 'rgba(220,220,220,0.9)',
  },

  columns: [
    { id: 'data.name',
      width: 220,     
      widthMin: 20,   
      widthMax: 800,   
      when: x=>( true ),
      css: 'data_name',
      headingCSS: 'head_data_name',
      heading:'Наименование',
      footing: 'количество: '+( tdsdata ? tdsdata.length : ''),
      footingCSS: 'foot_data_name',
    },
    { id: 'data.short_name',
      width: 160,     
      widthMin: 20,   
      widthMax: 530,   
      when: x=>( true ),
      heading:'Аббревиатура <br />или официальное краткое наименование',
    },
    { id: 'data.used_name',
      hidden: true, 
      width: 120,
      widthMin: 20,   
      widthMax: 200,   
      block:  'data.used_name',
      when: x=>( true ),
      heading: 'Общепринятое наименование',
    },
    { id: 'data.official_name',
      hidden: true, 
      width: 120,
      widthMin: 20,   
      widthMax: 600,   
      when: x=>( true ),
      heading: 'Официальное наименование',
    },
    { id: 'data.form_of_ownership',
      hidden: true, 
      width: 130,
      widthMin: 20,   
      widthMax: 200,   
      when: x=>( true ),
      heading: 'Организационно-правовая форма',
    },
    { id: 'data.category_institutions',
      width: 100,
      widthMin: 20,   
      widthMax: 145,   
      when: x=>( true ),
      heading: 'Категория учреждения',
    },
    { id: 'data.curator_at_ministry_of_culture',
      hidden: true, 
      width: 100,
      widthMin: 20,   
      widthMax: 145,   
      when: x=>( true ),
      heading: 'Куратор в Минкультуры России',
    },
    { id: 'data.cat',
      hidden: true, 
      width: 180,
      widthMin: 20,   
      block: x=>('ИНН: &nbsp; &nbsp; &nbsp;'+x['data.inn']+'<br />'
                +'КПП: &nbsp; &nbsp; &nbsp;'+x['data.cat']+'<br />'
                +'ОГРН: &nbsp; &nbsp;'+x['data.psrn']+'<br />'
                +'КОПУК: '+x['data.kopuk'] ),
      heading: 'ИНН<br />КПП, ОГРН<br />КОПУК',
    },
    { id: 'data.address',
      width: 120,
      widthMin: 20,   
      widthMax: 500,   
      block: x=>('<span style="color:blue;">&#x2709;</span> '+x['data.address']+'<br />'
                +'<span style="color:blue;">&#x2706;</span> '+x['data.phone_number'] ),
      heading: 'Адрес, телефон',
    },
    { id: 'data.website_address',
      width: 150,
      widthMin: 20,   
      widthMax: 145,   
      when: x=>( true ),
      heading: 'Адрес сайта',
    },
  ],
};

>>>>>>> 31ab00096c8b9977f1bb9edb5526847d88be0c1d
