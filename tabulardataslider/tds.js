<<<<<<< HEAD
<!-- tabular data slider  - слайдер табличных данных --> 
const int = (x)=>(+/-*\d+/.exec(x));

class TDS {
  constructor( base, jsonData, param ) {

    this.base = base ;
    this.base.tabIndex = "0";   // для перехода на таблицу по tab (получение фокуса)
    this.jsonData = jsonData;
    // значения по умолчанию
    let defTable = {
      strip: 6,  // полосы LevelGaugeXY: 0 - нет, > 0 - ширина полос
      grid:  2,  // сетка таблицы: 0 - нет, > 0 - сетка
      rowHeight: 22,     // высота строки по умолчанию (0-нет строк)
      headingHeight: 22, // высота заголовка по умолчанию (0-нет заголовка)
      footingHeight: 0,  // высота подвала по умолчанию (0-нет подвала)
      iniCols: [],       // настройки колонок
      orderCols: [],     // порядок вывода колонок
    }
    let fixed = ('fixed' in param ) ? +param.fixed: 0 ;  // количество зафиксированных
    for ( let key in defTable ) {
     let value = ( key in param ) ? +param[key] : defTable[key];
     if ( key == 'fixed' ) ;
     else this[key] = value;
    }

    // пользовательские настройки колонок
    if ( ('columns' in param ) && param.columns.length > 0 ) {
      for ( let i=0; i < param.columns.length; i++ ) {
        let iniCol = param.columns[i];
        this.iniCols[ iniCol.id ] = new DefColumn( iniCol.id, iniCol );         
      }
      this.iniCols.length = param.columns.length;      

    // формирование настроек кололнок по умолчанию
    } else if ( this.jsonData && this.jsonData.length > 0 ) {
      // максимальная ширина колонки, по умолчанию 
      let widthMax = this.base.clientWidth-this.strip-this.grid;  
      for ( let title in this.jsonData[0] ) {
        this.iniCols[title] = new DefColumn(title, 
          { widthMin:20, 
            widthMax: widthMax, 
            css: '-tds-'+typeof(this.jsonData[0][title]) });
        this.iniCols.length++;
      }
    }

    // инициализация основных блоков TDS: slide, [heading], [footing]
    this._iniBlockTDS( param.lgxy, fixed );

     // подключение обработчика событий tds
    this.eventTDS();
    // первоначальная установка
    this.lgxy.lenX = this.orderCols.length;  // количество видимых колонок
    this.lgxy.lenY = this.jsonData.length;    // количество записей

    this.rec = 0;
    this.row = 0;
    this.col = 0;

    this.innerSlide(); // заполняем данными
    this.sayCursor(); // показать курсор

  }

  // текущее положение курсора
  set col( value ) { this.lgxy.x = value ; }
  get col()        { return this.lgxy.x; } 
  set colMax( value ) { this.lgxy.lenX = value+1; }
  get colMax()     { return this.lgxy.lenX-1; }

  // _curRow;
  set row( value ) {  
    this._curRow = ( value < 0 ) ? 0 : 
                   ( value > this.rowMax ) ? this.rowMax :
                     value ;
  }
  get row()    { return this._curRow; } 
  get rowMax() { return this._rows-1; }

  // текущая запись
  set rec( value )  { this.lgxy.y = value ; }
  get rec()         { return this.lgxy.y; } 
  get recTopSlide() { return this.rec - this.row; }
  get recMax()      { return this.lgxy.lenY-1; }

  _fixed = 0;       // количество зафиксированных столбцов
  set fixed( value ) { 
    if ( value < 0 ) value = 0;
    else if ( value > this.slide.cols.length ) value = this.slide.cols.length;

    let isHead = this.headingHeight, isFoot = this.footingHeight;
    let slide = this.slide, heading = this.heading, footing = this.footing;
    let dW=0, slot;

    if ( this._fixed < value ) {
      slot= 'fixed';
      for (let i=value-this._fixed; i>0; i--){
        let col = slide.work.firstChild;

        dW += ( col.offsetWidth ) ? int(col.style.width) + this.grid : 0 ;
        slide.fixed.appendChild( col );
        if (isHead) heading.fixed.appendChild( heading.work.firstChild );
        if (isFoot) footing.fixed.appendChild( footing.work.firstChild );
      }

    } else if ( this._fixed > value ) {
      slot= 'work';
      for ( let i=this._fixed-value; i>0; i--){
        let col = slide.fixed.lastChild;

        dW += ( col.offsetWidth ) ? int(col.style.width) + this.grid : 0 ;
        slide.work.insertBefore( col, slide.work.firstChild );
        if (isHead) heading.work.insertBefore( heading.fixed.lastChild, heading.work.firstChild );
        if (isFoot) footing.work.insertBefore( footing.fixed.lastChild, footing.work.firstChild );
      }
    }
    if (dW) this.resizeSlot( slot, dW );
    this._fixed = value; 
  }
  get fixed() { return this._fixed ; }      


  // события таблицы
  eventTDS( add = true ) {

    // для мыши обязательно table 
    if ( add ) {
      let _this = this;
      this.table.addEventListener('mousedown', this._mousedownEvent = e => { _this.mouseTable(e,_this) }, false );
      this.table.addEventListener('dblclick', this._mousedblEvent = e => { _this.mouseTable(e,_this) }, false );
      this.base.addEventListener('levelgaugexy', this._lgxyEvent = e => { _this.currentLGXY(e,_this) } );
      this.base.addEventListener('keydown', this._keydownEvent = e => { _this.keyTable(e,_this) }, false );

    // disable event listening:
    } else {
      this.table.removeEventListener('mousedown', this._mousedownEvent, false );
      this.table.removeEventListener('dblclick', this._mousedblEvent, false );
      this.base.removeEventListener('levelgaugexy', this._lgxyEvent );
      this.base.removeEventListener('keydown', this._keydownEvent, false );
    }
  }

  // отобразить страницу согласно levelgaugexy
  currentLGXY(e, _this) {

    // вертикальный
    if ( 'y' in e.detail ){
      let bof = e.detail.y.value < 0;
      let top = !e.detail.y.new ;
      let bottom = e.detail.y.new == _this.recMax;
      let eof = e.detail.y.value > e.detail.y.new;
      let skip = e.detail.y.new - e.detail.y.old;
      let refrech = ( bof && !top ) || ( eof && !bottom ) 
                    || _this.row + skip < 0 
                    || _this.row + skip > _this.rowMax;
      if ( skip ) {

        if ( bof || top ) {
          _this.row = 0;

        } else if ( eof || bottom ) {
          _this.row = _this.rowMax;

        } else if ( !refrech ) {  
          // перемещение в текущей странице
          _this.row += skip;

        } else if ( _this.recTopSlide < 0 ) {
          // удержание первого ряда у шапки
          _this.row += _this.recTopSlide;

        } else if ( _this.recTopSlide + _this.rowMax  > _this.recMax ) {
          // удержание последнего ряда у подвала
          _this.row += _this.recTopSlide + _this.rowMax - _this.recMax;
        } 
        if (refrech) _this.innerSlide();
        _this.sayCursor();
      }
    }  

    // горизонтальный 
    if ( 'x' in e.detail &&  e.detail.x.new == e.detail.x.value ) {
      _this.sayCursor();
    }
  } // END sayPageTable(e, _this)

  // отображение курсора: _objCursor;
  sayCursor() {     

    // снимаем подсветку с предыдущей ячейки
    if ( typeof( this._objCursor) == 'object' ) {
      this._objCursor.classList.remove('-tds-cursor');
      this._objCursor.blur(); // снимаем фокус
    }
    if ( !~this.colMax ) return;  // нет строк

    let ord = this.orderCols[this.col];
    let col = this.slide.cols[ord]; 
    let cell = col.children[this.row];

    // устанавливаем подсветку текущей ячейки
    cell.classList.add('-tds-cursor');
    cell.focus();   // уставливаем фокус
    this._objCursor = cell;

    // вертикальный скроллинг слайда:
    let top = this.slide.work.offsetTop + cell.offsetTop; 
    let scroll = (y)=>{
      this.slide.work.style.top  = this.slide.fixed.style.top = y+'px';
    };
    // - текущая ячейка под заголовком ( слайд опускаем вниз )
    if ( top < this.headingHeight ) { 
      scroll( this.headingHeight ); 

    // - нижняя граница текущей ячейки под подвалом или ниже границы слайда
    // ( слайд поднимаем вверх )
    } else if ( ( top + cell.offsetHeight ) 
            > ( this.table.clientHeight - this.footingHeight ) ) {
      scroll( this.headingHeight 
            - ( this._hideRow > this.grid ? 
                this._hideRow - this.grid : 0 ) );
    }

    // горизонтальный скроллинг слайда ( приоретет левого края текущей ячейки )
    let fixedTable  = int(this.slide.fixed.style.width);
    let clientTable = this.table.clientWidth;
    let left = int(this.slide.work.style.left) + col.offsetLeft;
    let width  = int(col.style.width) + this.grid;
    scroll = (x)=>{
      x += 'px';
      this.slide.work.style.left = x;
      if ( this.headingHeight ) this.heading.work.style.left = x;
      if ( this.footingHeight ) this.footing.work.style.left = x;
    };

    // - фиксированная часть не скроллится
    if ( ord < this.fixed );  

    // - выравниваем по левому краю (движение влево)
    else if ( left < fixedTable || ( width > clientTable - fixedTable) ) {
      scroll( fixedTable - col.offsetLeft ); 

    // - выравниваем по правому краю (движение вправо)
    } else if ( left + width > clientTable ){
      scroll( clientTable - col.offsetLeft - width ); 
    }

    // принудительная фиксация table ( браузер "помогает" )
    if (this.table.scrollTop)  this.table.scrollTop = 0;
    if (this.table.scrollLeft) this.table.scrollLeft= 0;
  } // END sayCursor()

  // содержимое ячеек слайда
  innerCell( block, cell, col, rec ) {
    switch ( typeof(block) ) {
    case 'string': 
      cell.innerHTML = this.jsonData[rec][block];
      break;
    case 'function': 
      cell.innerHTML = block( this.jsonData[rec] );
      break;

    default:
      cell.innerHTML = this.jsonData[rec][col.id];
    }        
  } // END innerCel()

  // содержимое ячеек ряда слайда
  innerRow( row ) {
    let rec = this.recTopSlide + row;
    let cols = this.slide.cols;  
    for ( let i=0; i < cols.length; i++) { 
      let col   = cols[i];
      let block = this.iniCols[col.id].block;
      let cells = col.children;
      this.innerCell( block, cells[row], col, rec );
    }
  } // END innerRow()


  // содержимое слайда (обновление данных)
  innerSlide(){
    let j0 = this.recTopSlide;
    let cols = this.slide.cols;  
    for ( let i=0; i < cols.length; i++) { 
      let col   = cols[i];
      let block = this.iniCols[col.id].block;
      let cells = col.children;
      for ( let j=0; j < cells.length; j++ ) {     
        this.innerCell( block, cells[j], col, j+j0 );
      }                                                 
    }
  } // END innerSlide()

  // изменение размеров слотов таблицы
  resizeSlot( slot, dWidth, swap = true ) {
    let isHead = this.headingHeight;
    let isFoot = this.footingHeight;
    let twin = ( slot == 'work') ? 'fixed' : 'work';

    let elC = ( isHead ) ? this.heading : this.slide;
    let slotWidth = int( elC[slot].style.width) + dWidth + 'px';
    let twinWidth = int( elC[twin].style.width) - dWidth + 'px';

    if (swap) this.slide[twin].style.width = twinWidth;
    this.slide[slot].style.width = slotWidth;

    if (isHead) {
      if (swap) this.heading[twin].style.width = twinWidth;
      this.heading[slot].style.width = slotWidth;
    }
    
    if (isFoot) {
      if (swap) this.footing[twin].style.width = twinWidth;
      this.footing[slot].style.width = slotWidth;
    }

    // фиксируем положение слотов: .work 
    if ( swap || slot == 'fixed') {
      if ( swap && slot == 'work' ) slotWidth = twinWidth ;
      this.slide.work.style.left = slotWidth;
      if (isHead) this.heading.work.style.left = slotWidth;
      if (isFoot) this.footing.work.style.left = slotWidth;
    }
  } // END resizeSlot()

  // редактирование
  edit( key = '' ){
    // параметры текущей ячейки (до входа-выхода в редактирование)
    let cell = this._objCursor;
    if ( cell.contentEditable == 'true' ) return;

    let row  = this.row;
    let col  = this.slide.cols[this.orderCols[this.col]]; 
    let ini  = this.iniCols[col.id];
    let rec  = this.rec;
    let recTopSlide = this.recTopSlide;
    let eBegin, eEnd;

    // слепок значения, для идентификации изменения
    let vRenew = ini.renew[0]( this.jsonData[rec] );
    let renew = ( n = ini.renew[1] )=>{   // обновление ячеек слайдера
      if ( recTopSlide == this.recTopSlide ) {
        // сладер не перемещался по данным
        switch ( n ) {
        case 1: 
          this.innerCell( ini.block, cell, col, rec );
          break;
        case 2: 
          this.innerRow( row );
          break;
        case 3: 
          this.innerSlide();
          break;
        }
      }
    }

    if ( !ini.when( this.jsonData[rec] ) ) {
      if ( vRenew !== ini.renew[0]( this.jsonData[rec] ) ) renew();
      return;
    }

    switch ( typeof(ini.blockedit) ) {
    case 'string': 
      if ( typeof(this.jsonData[rec][ini.blockedit]) !== 'string' ) break;

      cell.contentEditable = true;
      cell.blur();
      this.base.removeEventListener('keydown', this._keydownEvent, false );

      eBegin = (e) => {
        cell.innerHTML = ( key === '' ) ? this.jsonData[rec][ini.blockedit] : key ;
        // установка выделения или курсора
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(cell);
        if (key !== '') range.collapse();
        selection.addRange(range);
      };

      eEnd   = (e) => {
        if ( cell.innerHTML == cell.textContent) {
          this.jsonData[rec][ini.blockedit] = cell.innerHTML;
        }
        if ( vRenew !== ini.renew[0]( this.jsonData[rec] ) ) renew();
        else renew( 1 );

        cell.contentEditable = false;
        cell.removeEventListener('focus', eBegin);
        cell.removeEventListener('blur', eEnd );
        cell.removeEventListener('keydown', eKey );
        cell.focus();
        this.base.addEventListener('keydown', this._keydownEvent, false );
      };

      let eKey = (e) => {
        if ( ['ArrowDown','ArrowUp','Enter','PageDown','PageUp','Escape'].includes(e.key) ) {
          if (e.key == 'Escape') 
            cell.innerHTML = this.jsonData[rec][ini.blockedit];
          e.preventDefault();
          e.target.blur();
        } 
      }

      cell.addEventListener('focus', eBegin );
      cell.addEventListener('blur', eEnd );
      cell.addEventListener('keydown', eKey );

      cell.focus();
      break;

    case 'function': 
      // cell.innerHTML = ini.block( this.jsonData[rec] );
      break;

    default:
      // cell.innerHTML = this.jsonData[rec][col.id];
    }        
  } // END edit()


  // навигация по нажатию клавиатуры 
  keyTable(e, _this) {
    let isProcessed = true;
    let key = e.key;

    if ( !e.ctrlKey && !e.altKey &&
       ( ~e.code.indexOf('Key') 
      || ~e.code.indexOf('Digit') || ~e.code.indexOf('Numpad') 
      || ~['Backquote','Minus','Equal','IntlYen','BracketLeft','BracketRight',
           'Backslash','Semicolon','Quote','IntlBackslash','Comma','Period',
           'Slash','IntlRo'].indexOf(e.code) ) ) {
      key = 'Enter';
    }

    switch (key) {
    case 'ArrowRight': // вправо на столбец
      _this.col++;
      break;

    case 'ArrowLeft':   // влево на столбец
      _this.col--;
      break;	

    case 'ArrowDown':   
      if (e.ctrlKey) { // на последнюю строку текущего столбца
        _this.rec = _this.recMax;
      } else {         // вниз на строку
        _this.rec++;
      } 
      break;	

    case 'ArrowUp':     
      if (e.ctrlKey) { // на первую строку текущего столбца
        _this.rec = 0;
      } else {   // вверх на строку
        _this.rec--;
      } 
      break;	

    case 'Home':     
      _this.col = 0;   // на первый столбец текущей строки
      if (e.ctrlKey) {      // на первый столбец первой строки
        _this.rec = 0;
      }
      break;

    case 'End':     
      _this.col = _this.colMax;  // на последний столбец текущей строки
      if (e.ctrlKey) {       // на последний столбец последней строки
        _this.rec = _this.recMax;
      }
      break;

    case 'PageDown':         // вниз на видимую страницу   
      _this.rec += _this._rows - (_this._hideRow ? 1 : 0);
      break;	

    case 'PageUp':           // вверх на видимую страницу
      _this.rec -= _this._rows - (_this._hideRow ? 1 : 0);
      break;

    case 'Enter':           // редактирование
      // вход в редактирование по Enter и отображаемого символа
      if ( !e.defaultPrevented ) _this.edit( (e.key == key) ? '' : e.key );
      break;

    default:
      isProcessed = false;
    }        

    if ( isProcessed ) e.preventDefault();   // отмена для браузера

  } // END keyTable(e)

  // навигация по нажатию мышки
  mouseTable(e, _this){
    let el = e.target;
    let elP, cl;
    while ( true ) {
      elP = el.parentElement;
      cl = el.classList.value;
      if ( ~cl.indexOf('-tds-') ) break;
      else el = elP;
    } 
    e.preventDefault(); // предотвратить запуск выделения (действие браузера)

    // ячейка таблицы
    if ( ~cl.indexOf('-tds-cell') ) {
      let col = _this.orderCols.indexOf( _this.slide.cols.indexOf( elP ) );
      if ( col !== _this.col ) _this.col = col;
      let row = [].slice.apply( elP.children).indexOf( el );
      let dRec = row - _this.row;
      if ( dRec ) _this.rec += dRec;
      if ( e.type == 'dblclick' ) {
        _this.edit();
      }

    // ячейка шапка 
    } else if ( ~cl.indexOf('-tds-heading-col') ) {
      _this.col = _this.orderCols.indexOf( _this.heading.cols.indexOf( el ) );

    // полоса изменения ширины столбца
    } else if ( ~cl.indexOf('-tds-heading') ) {
      let mPos = e.clientX;
      let shiftX = e.offsetX ;
      let sum;
      let seekCol = (c, i)=>{ 
           if ( !i ) sum = 0;
           return ( sum += c.offsetWidth + this.grid ) >= e.offsetX; } ;
      let n = [].slice.apply(el.children).findIndex( seekCol, _this);

      let col = el.children[n];

      _this.eventTDS( false ) ;
      _this.table.addEventListener('mousemove', resizeCol );
      _this.table.addEventListener('mouseup', resizeColStop );
      _this.table.addEventListener('mouseleave', resizeColStop );
      // устаналвиваем resize-курсор мыши (убираем "мигание")
      _this.table.style.cursor = 'col-resize';
      col.style.cursor = 'col-resize';
      if ( n+1 < el.children.length)
        el.children[n+1].style.cursor = 'col-resize';

      function resizeCol(e) {

        let dMove = e.clientX - mPos;
        mPos = e.clientX;

        let stop = false;

        let colWidth = int( col.style.width ); 

        if ( colWidth + dMove < _this.iniCols[ col.id ].widthMin ) {
          dMove = _this.iniCols[ col.id ].widthMin - colWidth;
          stop = true;
        }
        if ( colWidth + dMove > _this.iniCols[ col.id ].widthMax ) {
          dMove = _this.iniCols[ col.id ].widthMax - colWidth;
          stop = true;
        }

        if ( dMove ) { 
          let slot =  ~cl.indexOf('-tds-work') ? 'work' : 'fixed';
          colWidth = colWidth + dMove + 'px';  

          col.style.width = colWidth ; // ячейка заголовока

          _this.slide[slot].children[n].style.width = colWidth; 

          if (_this.footingHeight) {
            _this.footing[slot].children[n].style.width = colWidth; 
          }

          _this.resizeSlot( slot, dMove, false );
        }

        if (stop) resizeColStop();
      }

      function resizeColStop() {
        _this.table.removeEventListener('mouseleave', resizeColStop);
        _this.table.removeEventListener('mouseup', resizeColStop);
        _this.table.removeEventListener('mousemove', resizeCol);
        _this.eventTDS();

        // восстанавливаем курсор мыши
        _this.table.style.cursor = '';
        col.style.cursor = '';
        if ( n+1 < el.children.length)
          el.children[n+1].style.cursor = '';
      }

    // ячейка подвала
    } else if ( ~cl.indexOf('-tds-footing-col') ) {
      _this.col = _this.orderCols.indexOf( _this.footing.cols.indexOf( el ) );
    }
  } // END mouseTable(e,_this)


  // self destruction
  destroy() {

    this.base.tabIndex = "";  

    // destroy levelgaugexy
    this.lgxy.destroy();
    // DOM - очистка base 
    while ( this.base.children.length > 0) { 
      this.base.children[0].remove();
    }

    // disable event listening:
    this.eventTDS( false );

    // disconnect from class
    if ( this.base.tds.__proto__ ) this.base.tds.__proto__ = null;
    // disconnect from the div
    delete this.base.tds;

  } // END destroy()

  // инициализация основных блоков TDS
  _iniBlockTDS( lgxy, fixed ) {

    let block = (c,s,ac=[]) => { 
        let b = document.createElement('div');
        b.classList.add(c);
        ac.forEach( (css) => {
           if (css) b.classList.add( css ); });
        s.split(',').forEach( (css) => {
           let el = css.split('=');
           b.style[ el[0].split(' ').join('') ] = el[1]; 
        });
        return b;
    };

    // ТАБЛИЦА ( контейнер для заголовка, слайдера строк и подвала)
    let table = block('-tds-table',
         'width  =' + ( this.base.clientWidth  - this.strip ) + 'px,'
        +'height =' + ( this.base.clientHeight - this.strip ) + 'px');
    this.base.appendChild(table);

    // подключаем ИНДИКАТОРЫ индексов base.lgxy 
    levelGaugeXY( this.base, table, lgxy );
    this.lgxy = this.base.lgxy;

    // КОНТЕЙНЕРЫ таблицы: 
    // - количество строк в слайдере
    this._rows = Math.min(this.jsonData.length,  Math.ceil( 
      (table.clientHeight-this.headingHeight-this.footingHeight)/(this.rowHeight+this.grid) ));
    // - размеры слайда
    this.slideHeight = this._rows*(this.rowHeight + this.grid);  
    let slideWidth  = 0;
    for ( let id in this.iniCols ) {     
      slideWidth +=  this.iniCols[id].hidden ? 0 : this.iniCols[id].width + this.grid ; 
    }
    // - высота невидимой части "непоместившейся" строки
    this._hideRow = this.slideHeight + this.headingHeight + this.footingHeight 
         - table.clientHeight ;    

    // - формирование контейнера
    let container = ( name, prestyle='',  isCell ) => {
      let styles = prestyle+'left=0px, width='+slideWidth+'px, ' 
              +'height ='+ this[name+'Height']+'px';
      let cont = {};
      cont.fixed = block('-tds-'+name, styles );
      cont.fixed.style.width ='0';
      cont.fixed.classList.add('-tds-fixed');
      cont.work = block('-tds-'+name, styles);
      cont.work.classList.add('-tds-work');

      // колонки (ячейки) блока
      let i=0;
      for ( let id in this.iniCols ) {     
        let ini = this.iniCols[id];
        let none = ini.hidden ? ', display=none' : '';
        if ( isCell && !none ) this.orderCols[this.orderCols.length] = i;  
        i++;
        // шаблон столбца  
        let col = block('-tds-'+name+'-col',
                'marginRight='+this.grid+'px,' 
              + 'width = ' + ini.width+'px'+none,
              ( isCell ? void(0): ini[name+'CSS'] ) );
        col.id = id;    
        if ( isCell ) {
          // ячейки ряда
          for (let j=0; j < this._rows; j++) {
            let cell = block('-tds-cell',
                'marginBottom='+this.grid+'px,' 
              + 'height= ' + this.rowHeight +'px',
              ini.css);
            cell.tabIndex = "-1";  // для получения фокуса
            col.appendChild(cell);  // ячейки записываем в столбец
          }
        } else col.innerHTML = ini[name];  
        cont.work.appendChild(col); 
      }
      cont.cols = [];
      table.appendChild(cont.work);   
      table.appendChild(cont.fixed);   

      return cont;
    }; 

    // СЛАЙДЕР таблицы (контейнер для колонок)
    this.slide = container('slide', 'top='+this.headingHeight+'px,', true );

    // ШАПКА таблицы (контейнер для заголовков колонок)
    if ( this.headingHeight ) this.heading = container('heading');

    // ПОДВАЛ таблицы (контейнер для подвалов колонок)
    if (this.footingHeight) this.footing = container('footing', 'bottom=0px,');

    this.table = table;

    // перечень ссылок на столбцы ( данные, заголовок, подвал)
    this.makeColumnsLinks();

    // установка фиксации столбцов
    if (fixed) this.fixed = fixed;

  } // END iniBlockTDS()

  // перечень ссылок на столбцы ( данные, заголовок, подвал)
  // по содержимому слотов
  makeColumnsLinks() {
   let lb = [this.slide];
   if ( this.headingHeight ) lb[lb.length] = this.heading;
   if ( this.footingHeight ) lb[lb.length] = this.footing;

   lb.forEach( (b) => {
     b.cols.length = 0;
     b.cols.push.apply( b.cols, b.fixed.children );
     b.cols.push.apply( b.cols, b.work.children );
   });
  } // END makeColumnsLinks()


  // сервисная: текущая структура table
  struTable() {
    let aStru=[];
    let head, isHead = this.heading ? true : false ;
    if (isHead) head = this.heading.cols;
    let cols = this.slide.cols;
    let fixed = this.fixed;
    for ( let i=0; i < cols.length; i++ ) {
      aStru.push( 
           { name: isHead ? head[i].innerHTML : cols[i].id,
          display: cols[i].style.display == 'none' ? false : true,
            fixed: i < fixed,
              pos: i,
           }) ;
    }
    return aStru;
  } // END struTable()

} // END class TDS

// инициализация объекта столбцов TDS
class DefColumn {
  constructor( id, param = {} ) {
    let width = param['width'] ? param['width'] : 100;
    let defCol = {
      width: width,     // ширина (количество px)
      widthMin: width,  // минимальная  ширина (количество px)
      widthMax: width,  // максимальная ширина (количество px)
      block: id,        // 'ключ JSON' или ()=>{} - контекст ячейки данных
      blockedit: id,    // 'ключ JSON' или ()=>{} - редактирование ячейки данных
      heading: id,      // 'текст' или ()=>{} - заголовок столбца
      footing: '',      // 'текст' или ()=>{} - подвала столбца
      css: '',          // ['стили ячеек данных']
      headingCSS: '',   // ['стили ячеек заголовка']
      footingCSS: '',   // ['стили ячеек подвала']
      when: (x)=>{ return false; }, // ()=>{} - предусловие редактирования ячейки данных
      renew: [ (x)=>(x[id]), 2],    // ()=>{} - предусловие редактирования ячейки данных
      hidden: false,    // false | true скрыть столбец с экрана
    };
    for ( let key in defCol ) {
     let value = (key in param) ? param[key] : defCol[key];
     if ( ~['css','headingCSS','footingCSS'].indexOf(key) )
       this[key] = value.split(' ').join('').split(',');
     else this[key] = value;
    }
    if (this.widthMin<2) this.widthMin = 2;
    if (this.widthMax < this.widthMin ) this.widthMax = this.widthMin;
    if (this.width < this.widthMin || this.width > this.widthMax)
      this.width = this.widthMax; 
  }
} // END class DefColumn


// connecting an object of class LevelGaugeXY to the base div element
function tableDataSlider( idBase, jsonData=[], param={} ) {

  let base = document.getElementById( idBase );
  if ( !base ) return;

  // регистрация TDS 
  base.tds = new TDS( base, jsonData, param );      

}
=======
<!-- tabular data slider  - слайдер табличных данных --> 
const int = (x)=>(+/-*\d+/.exec(x));

class TDS {
  constructor( base, jsonData, param ) {

    this.base = base ;
    this.base.tabIndex = "0";   // для перехода на таблицу по tab (получение фокуса)
    this.jsonData = jsonData;
    // значения по умолчанию
    let defTable = {
      strip: 6,  // полосы LevelGaugeXY: 0 - нет, > 0 - ширина полос
      grid:  2,  // сетка таблицы: 0 - нет, > 0 - сетка
      rowHeight: 22,     // высота строки по умолчанию (0-нет строк)
      headingHeight: 22, // высота заголовка по умолчанию (0-нет заголовка)
      footingHeight: 0,  // высота подвала по умолчанию (0-нет подвала)
      iniCols: [],       // настройки колонок
      orderCols: [],     // порядок вывода колонок
    }
    let fixed = ('fixed' in param ) ? +param.fixed: 0 ;  // количество зафиксированных
    for ( let key in defTable ) {
     let value = ( key in param ) ? +param[key] : defTable[key];
     if ( key == 'fixed' ) ;
     else this[key] = value;
    }

    // пользовательские настройки колонок
    if ( ('columns' in param ) && param.columns.length > 0 ) {
      for ( let i=0; i < param.columns.length; i++ ) {
        let iniCol = param.columns[i];
        this.iniCols[ iniCol.id ] = new DefColumn( iniCol.id, iniCol );         
      }
      this.iniCols.length = param.columns.length;      

    // формирование настроек кололнок по умолчанию
    } else if ( this.jsonData && this.jsonData.length > 0 ) {
      // максимальная ширина колонки, по умолчанию 
      let widthMax = this.base.clientWidth-this.strip-this.grid;  
      for ( let title in this.jsonData[0] ) {
        this.iniCols[title] = new DefColumn(title, 
          { widthMin:20, 
            widthMax: widthMax, 
            css: '-tds-'+typeof(this.jsonData[0][title]) });
        this.iniCols.length++;
      }
    }

    // инициализация основных блоков TDS: slide, [heading], [footing]
    this._iniBlockTDS( param.lgxy, fixed );

     // подключение обработчика событий tds
    this.eventTDS();
    // первоначальная установка
    this.lgxy.lenX = this.orderCols.length;  // количество видимых колонок
    this.lgxy.lenY = this.jsonData.length;    // количество записей

    this.rec = 0;
    this.row = 0;
    this.col = 0;

    this.innerSlide(); // заполняем данными
    this.sayCursor(); // показать курсор

  }

  // текущее положение курсора
  set col( value ) { this.lgxy.x = value ; }
  get col()        { return this.lgxy.x; } 
  set colMax( value ) { this.lgxy.lenX = value+1; }
  get colMax()     { return this.lgxy.lenX-1; }

  // _curRow;
  set row( value ) {  
    this._curRow = ( value < 0 ) ? 0 : 
                   ( value > this.rowMax ) ? this.rowMax :
                     value ;
  }
  get row()    { return this._curRow; } 
  get rowMax() { return this._rows-1; }

  // текущая запись
  set rec( value )  { this.lgxy.y = value ; }
  get rec()         { return this.lgxy.y; } 
  get recTopSlide() { return this.rec - this.row; }
  get recMax()      { return this.lgxy.lenY-1; }

  _fixed = 0;       // количество зафиксированных столбцов
  set fixed( value ) { 
    if ( value < 0 ) value = 0;
    else if ( value > this.slide.cols.length ) value = this.slide.cols.length;

    let isHead = this.headingHeight, isFoot = this.footingHeight;
    let slide = this.slide, heading = this.heading, footing = this.footing;
    let dW=0, slot;

    if ( this._fixed < value ) {
      slot= 'fixed';
      for (let i=value-this._fixed; i>0; i--){
        let col = slide.work.firstChild;

        dW += ( col.offsetWidth ) ? int(col.style.width) + this.grid : 0 ;
        slide.fixed.appendChild( col );
        if (isHead) heading.fixed.appendChild( heading.work.firstChild );
        if (isFoot) footing.fixed.appendChild( footing.work.firstChild );
      }

    } else if ( this._fixed > value ) {
      slot= 'work';
      for ( let i=this._fixed-value; i>0; i--){
        let col = slide.fixed.lastChild;

        dW += ( col.offsetWidth ) ? int(col.style.width) + this.grid : 0 ;
        slide.work.insertBefore( col, slide.work.firstChild );
        if (isHead) heading.work.insertBefore( heading.fixed.lastChild, heading.work.firstChild );
        if (isFoot) footing.work.insertBefore( footing.fixed.lastChild, footing.work.firstChild );
      }
    }
    if (dW) this.resizeSlot( slot, dW );
    this._fixed = value; 
  }
  get fixed() { return this._fixed ; }      


  // события таблицы
  eventTDS( add = true ) {

    // для мыши обязательно table 
    if ( add ) {
      let _this = this;
      this.table.addEventListener('mousedown', this._mousedownEvent = e => { _this.mouseTable(e,_this) }, false );
      this.table.addEventListener('dblclick', this._mousedblEvent = e => { _this.mouseTable(e,_this) }, false );
      this.base.addEventListener('levelgaugexy', this._lgxyEvent = e => { _this.currentLGXY(e,_this) } );
      this.base.addEventListener('keydown', this._keydownEvent = e => { _this.keyTable(e,_this) }, false );

    // disable event listening:
    } else {
      this.table.removeEventListener('mousedown', this._mousedownEvent, false );
      this.table.removeEventListener('dblclick', this._mousedblEvent, false );
      this.base.removeEventListener('levelgaugexy', this._lgxyEvent );
      this.base.removeEventListener('keydown', this._keydownEvent, false );
    }
  }

  // отобразить страницу согласно levelgaugexy
  currentLGXY(e, _this) {

    // вертикальный
    if ( 'y' in e.detail ){
      let bof = e.detail.y.value < 0;
      let top = !e.detail.y.new ;
      let bottom = e.detail.y.new == _this.recMax;
      let eof = e.detail.y.value > e.detail.y.new;
      let skip = e.detail.y.new - e.detail.y.old;
      let refrech = ( bof && !top ) || ( eof && !bottom ) 
                    || _this.row + skip < 0 
                    || _this.row + skip > _this.rowMax;
      if ( skip ) {

        if ( bof || top ) {
          _this.row = 0;

        } else if ( eof || bottom ) {
          _this.row = _this.rowMax;

        } else if ( !refrech ) {  
          // перемещение в текущей странице
          _this.row += skip;

        } else if ( _this.recTopSlide < 0 ) {
          // удержание первого ряда у шапки
          _this.row += _this.recTopSlide;

        } else if ( _this.recTopSlide + _this.rowMax  > _this.recMax ) {
          // удержание последнего ряда у подвала
          _this.row += _this.recTopSlide + _this.rowMax - _this.recMax;
        } 
        if (refrech) _this.innerSlide();
        _this.sayCursor();
      }
    }  

    // горизонтальный 
    if ( 'x' in e.detail &&  e.detail.x.new == e.detail.x.value ) {
      _this.sayCursor();
    }
  } // END sayPageTable(e, _this)

  // отображение курсора: _objCursor;
  sayCursor() {     

    // снимаем подсветку с предыдущей ячейки
    if ( typeof( this._objCursor) == 'object' ) {
      this._objCursor.classList.remove('-tds-cursor');
      this._objCursor.blur(); // снимаем фокус
    }
    if ( !~this.colMax ) return;  // нет строк

    let ord = this.orderCols[this.col];
    let col = this.slide.cols[ord]; 
    let cell = col.children[this.row];

    // устанавливаем подсветку текущей ячейки
    cell.classList.add('-tds-cursor');
    cell.focus();   // уставливаем фокус
    this._objCursor = cell;

    // вертикальный скроллинг слайда:
    let top = this.slide.work.offsetTop + cell.offsetTop; 
    let scroll = (y)=>{
      this.slide.work.style.top  = this.slide.fixed.style.top = y+'px';
    };
    // - текущая ячейка под заголовком ( слайд опускаем вниз )
    if ( top < this.headingHeight ) { 
      scroll( this.headingHeight ); 

    // - нижняя граница текущей ячейки под подвалом или ниже границы слайда
    // ( слайд поднимаем вверх )
    } else if ( ( top + cell.offsetHeight ) 
            > ( this.table.clientHeight - this.footingHeight ) ) {
      scroll( this.headingHeight 
            - ( this._hideRow > this.grid ? 
                this._hideRow - this.grid : 0 ) );
    }

    // горизонтальный скроллинг слайда ( приоретет левого края текущей ячейки )
    let fixedTable  = int(this.slide.fixed.style.width);
    let clientTable = this.table.clientWidth;
    let left = int(this.slide.work.style.left) + col.offsetLeft;
    let width  = int(col.style.width) + this.grid;
    scroll = (x)=>{
      x += 'px';
      this.slide.work.style.left = x;
      if ( this.headingHeight ) this.heading.work.style.left = x;
      if ( this.footingHeight ) this.footing.work.style.left = x;
    };

    // - фиксированная часть не скроллится
    if ( ord < this.fixed );  

    // - выравниваем по левому краю (движение влево)
    else if ( left < fixedTable || ( width > clientTable - fixedTable) ) {
      scroll( fixedTable - col.offsetLeft ); 

    // - выравниваем по правому краю (движение вправо)
    } else if ( left + width > clientTable ){
      scroll( clientTable - col.offsetLeft - width ); 
    }

    // принудительная фиксация table ( браузер "помогает" )
    if (this.table.scrollTop)  this.table.scrollTop = 0;
    if (this.table.scrollLeft) this.table.scrollLeft= 0;
  } // END sayCursor()

  // содержимое ячеек слайда
  innerCell( block, cell, col, rec ) {
    switch ( typeof(block) ) {
    case 'string': 
      cell.innerHTML = this.jsonData[rec][block];
      break;
    case 'function': 
      cell.innerHTML = block( this.jsonData[rec] );
      break;

    default:
      cell.innerHTML = this.jsonData[rec][col.id];
    }        
  } // END innerCel()

  // содержимое ячеек ряда слайда
  innerRow( row ) {
    let rec = this.recTopSlide + row;
    let cols = this.slide.cols;  
    for ( let i=0; i < cols.length; i++) { 
      let col   = cols[i];
      let block = this.iniCols[col.id].block;
      let cells = col.children;
      this.innerCell( block, cells[row], col, rec );
    }
  } // END innerRow()


  // содержимое слайда (обновление данных)
  innerSlide(){
    let j0 = this.recTopSlide;
    let cols = this.slide.cols;  
    for ( let i=0; i < cols.length; i++) { 
      let col   = cols[i];
      let block = this.iniCols[col.id].block;
      let cells = col.children;
      for ( let j=0; j < cells.length; j++ ) {     
        this.innerCell( block, cells[j], col, j+j0 );
      }                                                 
    }
  } // END innerSlide()

  // изменение размеров слотов таблицы
  resizeSlot( slot, dWidth, swap = true ) {
    let isHead = this.headingHeight;
    let isFoot = this.footingHeight;
    let twin = ( slot == 'work') ? 'fixed' : 'work';

    let elC = ( isHead ) ? this.heading : this.slide;
    let slotWidth = int( elC[slot].style.width) + dWidth + 'px';
    let twinWidth = int( elC[twin].style.width) - dWidth + 'px';

    if (swap) this.slide[twin].style.width = twinWidth;
    this.slide[slot].style.width = slotWidth;

    if (isHead) {
      if (swap) this.heading[twin].style.width = twinWidth;
      this.heading[slot].style.width = slotWidth;
    }
    
    if (isFoot) {
      if (swap) this.footing[twin].style.width = twinWidth;
      this.footing[slot].style.width = slotWidth;
    }

    // фиксируем положение слотов: .work 
    if ( swap || slot == 'fixed') {
      if ( swap && slot == 'work' ) slotWidth = twinWidth ;
      this.slide.work.style.left = slotWidth;
      if (isHead) this.heading.work.style.left = slotWidth;
      if (isFoot) this.footing.work.style.left = slotWidth;
    }
  } // END resizeSlot()

  // редактирование
  edit( key = '' ){
    // параметры текущей ячейки (до входа-выхода в редактирование)
    let cell = this._objCursor;
    if ( cell.contentEditable == 'true' ) return;

    let row  = this.row;
    let col  = this.slide.cols[this.orderCols[this.col]]; 
    let ini  = this.iniCols[col.id];
    let rec  = this.rec;
    let recTopSlide = this.recTopSlide;
    let eBegin, eEnd;

    // слепок значения, для идентификации изменения
    let vRenew = ini.renew[0]( this.jsonData[rec] );
    let renew = ( n = ini.renew[1] )=>{   // обновление ячеек слайдера
      if ( recTopSlide == this.recTopSlide ) {
        // сладер не перемещался по данным
        switch ( n ) {
        case 1: 
          this.innerCell( ini.block, cell, col, rec );
          break;
        case 2: 
          this.innerRow( row );
          break;
        case 3: 
          this.innerSlide();
          break;
        }
      }
    }

    if ( !ini.when( this.jsonData[rec] ) ) {
      if ( vRenew !== ini.renew[0]( this.jsonData[rec] ) ) renew();
      return;
    }

    switch ( typeof(ini.blockedit) ) {
    case 'string': 
      if ( typeof(this.jsonData[rec][ini.blockedit]) !== 'string' ) break;

      cell.contentEditable = true;
      cell.blur();
      this.base.removeEventListener('keydown', this._keydownEvent, false );

      eBegin = (e) => {
        cell.innerHTML = ( key === '' ) ? this.jsonData[rec][ini.blockedit] : key ;
        // установка выделения или курсора
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(cell);
        if (key !== '') range.collapse();
        selection.addRange(range);
      };

      eEnd   = (e) => {
        if ( cell.innerHTML == cell.textContent) {
          this.jsonData[rec][ini.blockedit] = cell.innerHTML;
        }
        if ( vRenew !== ini.renew[0]( this.jsonData[rec] ) ) renew();
        else renew( 1 );

        cell.contentEditable = false;
        cell.removeEventListener('focus', eBegin);
        cell.removeEventListener('blur', eEnd );
        cell.removeEventListener('keydown', eKey );
        cell.focus();
        this.base.addEventListener('keydown', this._keydownEvent, false );
      };

      let eKey = (e) => {
        if ( ['ArrowDown','ArrowUp','Enter','PageDown','PageUp','Escape'].includes(e.key) ) {
          if (e.key == 'Escape') 
            cell.innerHTML = this.jsonData[rec][ini.blockedit];
          e.preventDefault();
          e.target.blur();
        } 
      }

      cell.addEventListener('focus', eBegin );
      cell.addEventListener('blur', eEnd );
      cell.addEventListener('keydown', eKey );

      cell.focus();
      break;

    case 'function': 
      // cell.innerHTML = ini.block( this.jsonData[rec] );
      break;

    default:
      // cell.innerHTML = this.jsonData[rec][col.id];
    }        
  } // END edit()


  // навигация по нажатию клавиатуры 
  keyTable(e, _this) {
    let isProcessed = true;
    let key = e.key;

    if ( !e.ctrlKey && !e.altKey &&
       ( ~e.code.indexOf('Key') 
      || ~e.code.indexOf('Digit') || ~e.code.indexOf('Numpad') 
      || ~['Backquote','Minus','Equal','IntlYen','BracketLeft','BracketRight',
           'Backslash','Semicolon','Quote','IntlBackslash','Comma','Period',
           'Slash','IntlRo'].indexOf(e.code) ) ) {
      key = 'Enter';
    }

    switch (key) {
    case 'ArrowRight': // вправо на столбец
      _this.col++;
      break;

    case 'ArrowLeft':   // влево на столбец
      _this.col--;
      break;	

    case 'ArrowDown':   
      if (e.ctrlKey) { // на последнюю строку текущего столбца
        _this.rec = _this.recMax;
      } else {         // вниз на строку
        _this.rec++;
      } 
      break;	

    case 'ArrowUp':     
      if (e.ctrlKey) { // на первую строку текущего столбца
        _this.rec = 0;
      } else {   // вверх на строку
        _this.rec--;
      } 
      break;	

    case 'Home':     
      _this.col = 0;   // на первый столбец текущей строки
      if (e.ctrlKey) {      // на первый столбец первой строки
        _this.rec = 0;
      }
      break;

    case 'End':     
      _this.col = _this.colMax;  // на последний столбец текущей строки
      if (e.ctrlKey) {       // на последний столбец последней строки
        _this.rec = _this.recMax;
      }
      break;

    case 'PageDown':         // вниз на видимую страницу   
      _this.rec += _this._rows - (_this._hideRow ? 1 : 0);
      break;	

    case 'PageUp':           // вверх на видимую страницу
      _this.rec -= _this._rows - (_this._hideRow ? 1 : 0);
      break;

    case 'Enter':           // редактирование
      // вход в редактирование по Enter и отображаемого символа
      if ( !e.defaultPrevented ) _this.edit( (e.key == key) ? '' : e.key );
      break;

    default:
      isProcessed = false;
    }        

    if ( isProcessed ) e.preventDefault();   // отмена для браузера

  } // END keyTable(e)

  // навигация по нажатию мышки
  mouseTable(e, _this){
    let el = e.target;
    let elP, cl;
    while ( true ) {
      elP = el.parentElement;
      cl = el.classList.value;
      if ( ~cl.indexOf('-tds-') ) break;
      else el = elP;
    } 
    e.preventDefault(); // предотвратить запуск выделения (действие браузера)

    // ячейка таблицы
    if ( ~cl.indexOf('-tds-cell') ) {
      let col = _this.orderCols.indexOf( _this.slide.cols.indexOf( elP ) );
      if ( col !== _this.col ) _this.col = col;
      let row = [].slice.apply( elP.children).indexOf( el );
      let dRec = row - _this.row;
      if ( dRec ) _this.rec += dRec;
      if ( e.type == 'dblclick' ) {
        _this.edit();
      }

    // ячейка шапка 
    } else if ( ~cl.indexOf('-tds-heading-col') ) {
      _this.col = _this.orderCols.indexOf( _this.heading.cols.indexOf( el ) );

    // полоса изменения ширины столбца
    } else if ( ~cl.indexOf('-tds-heading') ) {
      let mPos = e.clientX;
      let shiftX = e.offsetX ;
      let sum;
      let seekCol = (c, i)=>{ 
           if ( !i ) sum = 0;
           return ( sum += c.offsetWidth + this.grid ) >= e.offsetX; } ;
      let n = [].slice.apply(el.children).findIndex( seekCol, _this);

      let col = el.children[n];

      _this.eventTDS( false ) ;
      _this.table.addEventListener('mousemove', resizeCol );
      _this.table.addEventListener('mouseup', resizeColStop );
      _this.table.addEventListener('mouseleave', resizeColStop );
      // устаналвиваем resize-курсор мыши (убираем "мигание")
      _this.table.style.cursor = 'col-resize';
      col.style.cursor = 'col-resize';
      if ( n+1 < el.children.length)
        el.children[n+1].style.cursor = 'col-resize';

      function resizeCol(e) {

        let dMove = e.clientX - mPos;
        mPos = e.clientX;

        let stop = false;

        let colWidth = int( col.style.width ); 

        if ( colWidth + dMove < _this.iniCols[ col.id ].widthMin ) {
          dMove = _this.iniCols[ col.id ].widthMin - colWidth;
          stop = true;
        }
        if ( colWidth + dMove > _this.iniCols[ col.id ].widthMax ) {
          dMove = _this.iniCols[ col.id ].widthMax - colWidth;
          stop = true;
        }

        if ( dMove ) { 
          let slot =  ~cl.indexOf('-tds-work') ? 'work' : 'fixed';
          colWidth = colWidth + dMove + 'px';  

          col.style.width = colWidth ; // ячейка заголовока

          _this.slide[slot].children[n].style.width = colWidth; 

          if (_this.footingHeight) {
            _this.footing[slot].children[n].style.width = colWidth; 
          }

          _this.resizeSlot( slot, dMove, false );
        }

        if (stop) resizeColStop();
      }

      function resizeColStop() {
        _this.table.removeEventListener('mouseleave', resizeColStop);
        _this.table.removeEventListener('mouseup', resizeColStop);
        _this.table.removeEventListener('mousemove', resizeCol);
        _this.eventTDS();

        // восстанавливаем курсор мыши
        _this.table.style.cursor = '';
        col.style.cursor = '';
        if ( n+1 < el.children.length)
          el.children[n+1].style.cursor = '';
      }

    // ячейка подвала
    } else if ( ~cl.indexOf('-tds-footing-col') ) {
      _this.col = _this.orderCols.indexOf( _this.footing.cols.indexOf( el ) );
    }
  } // END mouseTable(e,_this)


  // self destruction
  destroy() {

    this.base.tabIndex = "";  

    // destroy levelgaugexy
    this.lgxy.destroy();
    // DOM - очистка base 
    while ( this.base.children.length > 0) { 
      this.base.children[0].remove();
    }

    // disable event listening:
    this.eventTDS( false );

    // disconnect from class
    if ( this.base.tds.__proto__ ) this.base.tds.__proto__ = null;
    // disconnect from the div
    delete this.base.tds;

  } // END destroy()

  // инициализация основных блоков TDS
  _iniBlockTDS( lgxy, fixed ) {

    let block = (c,s,ac=[]) => { 
        let b = document.createElement('div');
        b.classList.add(c);
        ac.forEach( (css) => {
           if (css) b.classList.add( css ); });
        s.split(',').forEach( (css) => {
           let el = css.split('=');
           b.style[ el[0].split(' ').join('') ] = el[1]; 
        });
        return b;
    };

    // ТАБЛИЦА ( контейнер для заголовка, слайдера строк и подвала)
    let table = block('-tds-table',
         'width  =' + ( this.base.clientWidth  - this.strip ) + 'px,'
        +'height =' + ( this.base.clientHeight - this.strip ) + 'px');
    this.base.appendChild(table);

    // подключаем ИНДИКАТОРЫ индексов base.lgxy 
    levelGaugeXY( this.base, table, lgxy );
    this.lgxy = this.base.lgxy;

    // КОНТЕЙНЕРЫ таблицы: 
    // - количество строк в слайдере
    this._rows = Math.min(this.jsonData.length,  Math.ceil( 
      (table.clientHeight-this.headingHeight-this.footingHeight)/(this.rowHeight+this.grid) ));
    // - размеры слайда
    this.slideHeight = this._rows*(this.rowHeight + this.grid);  
    let slideWidth  = 0;
    for ( let id in this.iniCols ) {     
      slideWidth +=  this.iniCols[id].hidden ? 0 : this.iniCols[id].width + this.grid ; 
    }
    // - высота невидимой части "непоместившейся" строки
    this._hideRow = this.slideHeight + this.headingHeight + this.footingHeight 
         - table.clientHeight ;    

    // - формирование контейнера
    let container = ( name, prestyle='',  isCell ) => {
      let styles = prestyle+'left=0px, width='+slideWidth+'px, ' 
              +'height ='+ this[name+'Height']+'px';
      let cont = {};
      cont.fixed = block('-tds-'+name, styles );
      cont.fixed.style.width ='0';
      cont.fixed.classList.add('-tds-fixed');
      cont.work = block('-tds-'+name, styles);
      cont.work.classList.add('-tds-work');

      // колонки (ячейки) блока
      let i=0;
      for ( let id in this.iniCols ) {     
        let ini = this.iniCols[id];
        let none = ini.hidden ? ', display=none' : '';
        if ( isCell && !none ) this.orderCols[this.orderCols.length] = i;  
        i++;
        // шаблон столбца  
        let col = block('-tds-'+name+'-col',
                'marginRight='+this.grid+'px,' 
              + 'width = ' + ini.width+'px'+none,
              ( isCell ? void(0): ini[name+'CSS'] ) );
        col.id = id;    
        if ( isCell ) {
          // ячейки ряда
          for (let j=0; j < this._rows; j++) {
            let cell = block('-tds-cell',
                'marginBottom='+this.grid+'px,' 
              + 'height= ' + this.rowHeight +'px',
              ini.css);
            cell.tabIndex = "-1";  // для получения фокуса
            col.appendChild(cell);  // ячейки записываем в столбец
          }
        } else col.innerHTML = ini[name];  
        cont.work.appendChild(col); 
      }
      cont.cols = [];
      table.appendChild(cont.work);   
      table.appendChild(cont.fixed);   

      return cont;
    }; 

    // СЛАЙДЕР таблицы (контейнер для колонок)
    this.slide = container('slide', 'top='+this.headingHeight+'px,', true );

    // ШАПКА таблицы (контейнер для заголовков колонок)
    if ( this.headingHeight ) this.heading = container('heading');

    // ПОДВАЛ таблицы (контейнер для подвалов колонок)
    if (this.footingHeight) this.footing = container('footing', 'bottom=0px,');

    this.table = table;

    // перечень ссылок на столбцы ( данные, заголовок, подвал)
    this.makeColumnsLinks();

    // установка фиксации столбцов
    if (fixed) this.fixed = fixed;

  } // END iniBlockTDS()

  // перечень ссылок на столбцы ( данные, заголовок, подвал)
  // по содержимому слотов
  makeColumnsLinks() {
   let lb = [this.slide];
   if ( this.headingHeight ) lb[lb.length] = this.heading;
   if ( this.footingHeight ) lb[lb.length] = this.footing;

   lb.forEach( (b) => {
     b.cols.length = 0;
     b.cols.push.apply( b.cols, b.fixed.children );
     b.cols.push.apply( b.cols, b.work.children );
   });
  } // END makeColumnsLinks()


  // сервисная: текущая структура table
  struTable() {
    let aStru=[];
    let head, isHead = this.heading ? true : false ;
    if (isHead) head = this.heading.cols;
    let cols = this.slide.cols;
    let fixed = this.fixed;
    for ( let i=0; i < cols.length; i++ ) {
      aStru.push( 
           { name: isHead ? head[i].innerHTML : cols[i].id,
          display: cols[i].style.display == 'none' ? false : true,
            fixed: i < fixed,
              pos: i,
           }) ;
    }
    return aStru;
  } // END struTable()

} // END class TDS

// инициализация объекта столбцов TDS
class DefColumn {
  constructor( id, param = {} ) {
    let width = param['width'] ? param['width'] : 100;
    let defCol = {
      width: width,     // ширина (количество px)
      widthMin: width,  // минимальная  ширина (количество px)
      widthMax: width,  // максимальная ширина (количество px)
      block: id,        // 'ключ JSON' или ()=>{} - контекст ячейки данных
      blockedit: id,    // 'ключ JSON' или ()=>{} - редактирование ячейки данных
      heading: id,      // 'текст' или ()=>{} - заголовок столбца
      footing: '',      // 'текст' или ()=>{} - подвала столбца
      css: '',          // ['стили ячеек данных']
      headingCSS: '',   // ['стили ячеек заголовка']
      footingCSS: '',   // ['стили ячеек подвала']
      when: (x)=>{ return false; }, // ()=>{} - предусловие редактирования ячейки данных
      renew: [ (x)=>(x[id]), 2],    // ()=>{} - предусловие редактирования ячейки данных
      hidden: false,    // false | true скрыть столбец с экрана
    };
    for ( let key in defCol ) {
     let value = (key in param) ? param[key] : defCol[key];
     if ( ~['css','headingCSS','footingCSS'].indexOf(key) )
       this[key] = value.split(' ').join('').split(',');
     else this[key] = value;
    }
    if (this.widthMin<2) this.widthMin = 2;
    if (this.widthMax < this.widthMin ) this.widthMax = this.widthMin;
    if (this.width < this.widthMin || this.width > this.widthMax)
      this.width = this.widthMax; 
  }
} // END class DefColumn


// connecting an object of class LevelGaugeXY to the base div element
function tableDataSlider( idBase, jsonData=[], param={} ) {

  let base = document.getElementById( idBase );
  if ( !base ) return;

  // регистрация TDS 
  base.tds = new TDS( base, jsonData, param );      

}
>>>>>>> 31ab00096c8b9977f1bb9edb5526847d88be0c1d
