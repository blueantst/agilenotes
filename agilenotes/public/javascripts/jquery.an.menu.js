/*!
 * Agile Notes 1.0
 *
 * Copyright 2013, Sihong Zhu and other contributors
* Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
* and GPL (http://www.opensource.org/licenses/gpl-license.php) version 2 licenses.
* This software is not distributed under version 3 or later of the GPL.
 *
 * http://agilemore.com/agilenotes
 */

(function($) {

var idIncrement = 0;

$.widget( "an.menu", {
	defaultElement: "<ul>",
	delay: 100,
	options: {
		submenuPosition: { my: "left top", at: "right top"},
		triggerEvent:"contextmenu",
		menuPosition:{ my: "left top", at: "left bottom"}
	},
	_create: function() {
		var o = this.options;
		this.element.addClass("an-menu");
		this.activeMenu = this.menu = this._createMenuContent(o.actions);
		this.menu.appendTo("body").hide();
		this.menuId = this.menu.attr( "id" ) || "ui-menu-" + idIncrement++;
		if(this.menu.find(".ui-icon").length) {
			this.menu.addClass( "ui-menu-icons" );
		}
		
		this.bindings = $();
		this.menu.addClass("ui-menu ui-widget ui-widget-content ui-corner-all")
			.attr({	id: this.menuId, role: "menu"})
			.css({"z-index":"999999"})
			// need to catch all clicks on disabled menu
			// not possible through _bind
			.bind( "click.menu", $.proxy( function( event ) {
				if ( o.disabled ) {event.preventDefault();}
			}, this));
		this._bind({
			"click .ui-menu-item:has(a)": function( event ) {
				var target = $( event.currentTarget );
				// it's possible to click an item without hovering it (#7085)
				if ( !this.active || ( this.active[ 0 ] !== target[ 0 ] ) ) {
					this.focus( event, target );
				}
				this.select( event );
				event.preventDefault();
			},
			"mouseover .ui-menu-item:not(.seperator)": function( event ) {
				event.stopImmediatePropagation();
				var target = $( event.currentTarget );
				// Remove ui-state-active class from siblings of the newly focused menu item to avoid a jump caused by adjacent elements both having a class with a border
				target.siblings().children( ".ui-state-active" ).removeClass( "ui-state-active" );
				this.focus( event, target );
			},
			"mouseleave": "_mouseleave",
			"mouseleave .ui-menu": "_mouseleave",
			"mouseout .ui-menu-item": "blur",
			"focus": function( event ) {
				this.focus( event, $( event.target ).children( ".ui-menu-item:first" ) );
			},
			"blur": "collapseAll"
		});

		this.refresh();

		this.menu.attr( "tabIndex", 0 );
		this._bind({
			"keydown": function( event ) {
				switch ( event.keyCode ) {
				case $.ui.keyCode.PAGE_UP:
					this.previousPage( event );
					event.preventDefault();
					event.stopImmediatePropagation();
					break;
				case $.ui.keyCode.PAGE_DOWN:
					this.nextPage( event );
					event.preventDefault();
					event.stopImmediatePropagation();
					break;
				case $.ui.keyCode.HOME:
					this._move( "first", "first", event );
					event.preventDefault();
					event.stopImmediatePropagation();
					break;
				case $.ui.keyCode.END:
					this._move( "last", "last", event );
					event.preventDefault();
					event.stopImmediatePropagation();
					break;
				case $.ui.keyCode.UP:
					this.previous( event );
					event.preventDefault();
					event.stopImmediatePropagation();
					break;
				case $.ui.keyCode.DOWN:
					this.next( event );
					event.preventDefault();
					event.stopImmediatePropagation();
					break;
				case $.ui.keyCode.LEFT:
					if (this.collapse( event )) {
						event.stopImmediatePropagation();
					}
					event.preventDefault();
					break;
				case $.ui.keyCode.RIGHT:
					if (this.expand( event )) {
						event.stopImmediatePropagation();
					}
					event.preventDefault();
					break;
				case $.ui.keyCode.ENTER:
					if ( this.active.children( "a[aria-haspopup='true']" ).length ) {
						if ( this.expand( event ) ) {
							event.stopImmediatePropagation();
						}
					}
					else {
						this.select( event );
						event.stopImmediatePropagation();
					}
					event.preventDefault();
					break;
				case $.ui.keyCode.ESCAPE:
					if ( this.collapse( event ) ) {
						event.stopImmediatePropagation();
					}
					event.preventDefault();
					break;
				default:
					event.stopPropagation();
					clearTimeout( this.filterTimer );
					var match,
						prev = this.previousFilter || "",
						character = String.fromCharCode( event.keyCode ),
						skip = false;

					if (character == prev) {
						skip = true;
					} else {
						character = prev + character;
					}
					function escape( value ) {
						return value.replace( /[-[\]{}()*+?.,\\^$|#\s]/g , "\\$&" );
					}
					match = this.activeMenu.children( ".ui-menu-item" ).filter( function() {
						return new RegExp("^" + escape(character), "i")
							.test( $( this ).children( "a" ).text() );
					});
					match = skip && match.index(this.active.next()) != -1 ? this.active.nextAll(".ui-menu-item") : match;
					if ( !match.length ) {
						character = String.fromCharCode(event.keyCode);
						match = this.activeMenu.children(".ui-menu-item").filter( function() {
							return new RegExp("^" + escape(character), "i")
								.test( $( this ).children( "a" ).text() );
						});
					}
					if ( match.length ) {
						this.focus( event, match );
						if (match.length > 1) {
							this.previousFilter = character;
							this.filterTimer = this._delay( function() {
								delete this.previousFilter;
							}, 1000 );
						} else {
							delete this.previousFilter;
						}
					} else {
						delete this.previousFilter;
					}
				}
			}
		});

		if(o.triggerEvent ){
			this.element.unbind(o.triggerEvent+".menu");
			this.element.bind(o.triggerEvent+".menu", $.proxy(function(event){
				var position = $.extend({}, {
					of: event,
					offset:"0 0"
				}, $.type(this.options.menuPosition) == "function"
					? this.options.menuPosition(this.active)
					: this.options.menuPosition
				);
				
				var prev = $(document).data("contextmenu");
				if(prev) prev.collapseAll();
				$(document).data("contextmenu",this);
				this.menu.show().position(position);
				
				if(this.options.triggerEvent == "contextmenu"){
					event.preventDefault();
				}
			},this));
		}
		
		this.proxy = $.proxy(function(event){
			var $t = $( event.target );
			if ($t.closest(".ui-menu" ).length || $t.closest(".an-menu").get(0) == this.element.get(0)) 
				return;
			this.collapseAll( event );
		},this); 
		$(document).bind("click.menu",this.proxy);
		
		if(o.autoShow){
			this.menu.position(
					$.type(this.options.menuPosition) == "function"
						? this.options.menuPosition(this.active)
						: this.options.menuPosition).show();
		}
	},

	_createMenuContent: function(actions){
		var self = this, menu = $("<ul/>");
		$.each(actions, function(k,v){
			switch(v.type){
			case "submenu":{
				var sm = self._createMenuContent(v.children);
				$("<li/>").append($("<a href='#'/>").text(v.text))
				          .append(sm).appendTo(menu);
			}
				break;
			case "menuItem":
				$("<a/>").attr("href","#"+k).text(v.text).click(function(e){
					v.handler(arguments);
					e.preventDefault();
				}).wrap("<li/>").parent().appendTo(menu);
				break;
			case "seperator":
				$("<li class='seperator'/>").append($("<a href='#'/>")).appendTo(menu);
				break;
			case "checkbox":{
				var input = $("<input/>").attr("type","checkbox").attr("name",v.name).prop("checked",v.checked);
				$("<a/>").attr("href","#"+k).text(v.text).click(function(e){
					var target = $(e.target), checked = false;
					if(target.is("a")){
						var input = target.find("input");
						checked = !input.prop("checked");
						input.prop("checked",checked);
					}else if(target.is("input")){
						checked = target.prop("checked");
					}
					v.handler(e,checked);
					e.stopImmediatePropagation();
				}).prepend(input).wrap("<li/>").parent().appendTo(menu);
			}
				break;
			}
		});
		return menu;
	},
	
	refresh: function() {
		// initialize nested menus
		var submenus = this.menu.find( "ul:not(.ui-menu)" )
			.addClass( "ui-menu ui-widget ui-widget-content ui-corner-all" )
			.attr( "role", "menu" )
			.hide()
			.attr( "aria-hidden", "true" )
			.attr( "aria-expanded", "false" );

		// don't refresh list items that are already adapted
		var menuId = this.menuId;
		submenus.add( this.menu ).children( "li:not(.ui-menu-item):has(a)" )
			.addClass( "ui-menu-item" )
			.attr( "role", "presentation" )
			.children( "a" )
				.addClass( "ui-corner-all" )
				.attr( "tabIndex", -1 )
				.attr( "role", "menuitem" )
				.attr( "id", function( i ) {
					return menuId + "-" + i;
				});
		submenus.each( function() {
			var menu = $( this ), item = menu.prev( "a" );
			item.attr( "aria-haspopup", "true" )
				.prepend( '<span class="ui-menu-icon ui-icon ui-icon-carat-1-e"></span>' );
			menu.attr( "aria-labelledby", item.attr( "id" ) );
		});
	},

	focus: function( event, item ) {
		this.blur( event );
		if ( this._hasScroll() ) {
			var borderTop = parseFloat( $.curCSS( this.activeMenu[0], "borderTopWidth", true ) ) || 0,
				paddingTop = parseFloat( $.curCSS( this.activeMenu[0], "paddingTop", true ) ) || 0,
				offset = item.offset().top - this.activeMenu.offset().top - borderTop - paddingTop,
				scroll = this.activeMenu.scrollTop(),
				elementHeight = this.activeMenu.height(),
				itemHeight = item.height();

			if ( offset < 0 ) {
				this.activeMenu.scrollTop( scroll + offset );
			} else if ( offset + itemHeight > elementHeight ) {
				this.activeMenu.scrollTop( scroll + offset - elementHeight + itemHeight );
			}
		}

		this.active = item.first()
			.children( "a" )
				.addClass( "ui-state-focus" )
			.end();
		this.menu.attr( "aria-activedescendant", this.active.children("a").attr("id") );

		// highlight active parent menu item, if any
		this.active.parent().closest(".ui-menu-item").children("a:first").addClass("ui-state-active");

		this.timer = this._delay( function() {
			this._close();
		}, this.delay );

		var nested = $( ">ul", item );
		if ( nested.length && ( /^mouse/.test( event.type ) ) ) {
			this._startOpening(nested);
		}
		this.activeMenu = item.parent();

		this._trigger( "focus", event, { item: item } );
	},

	blur: function( event ) {
		if ( !this.active ) {
			return;
		}

		clearTimeout( this.timer );

		this.active.children( "a" ).removeClass( "ui-state-focus" );
		this.active = null;

		this._trigger( "blur", event, { item: this.active } );
	},

	_startOpening: function( submenu ) {
		clearTimeout( this.timer );

		// Don't open if already open fixes a Firefox bug that caused a .5 pixel
		// shift in the submenu position when mousing over the carat icon
		if ( submenu.attr( "aria-hidden" ) !== "true" ) {
			return;
		}

		this.timer = this._delay( function() {
			this._close();
			this._open( submenu );
		}, this.delay );
	},

	_open: function(submenu) {
		clearTimeout(this.timer);
		this.menu
			.find(".ui-menu")
			.not(submenu.parents())
			.hide()
			.attr("aria-hidden", "true");

		var position = $.extend({}, {
				of: this.active
			}, $.type(this.options.submenuPosition) == "function"
				? this.options.submenuPosition(this.active)
				: this.options.submenuPosition
			);

		submenu.show()
			.removeAttr("aria-hidden")
			.attr("aria-expanded", "true")
			.position( position );
	},
	
	collapseAll: function( event ) {
		var currentMenu = false;
		if ( event ) {
			var target = $( event.target );
			if ( target.is( ".ui-menu" ) ) {
				currentMenu = target;
			} else if ( target.closest( ".ui-menu" ).length ) {
				currentMenu = target.closest( ".ui-menu" );
			}
		}
		this._close( currentMenu );
		this.blur( event );
		this.activeMenu = this.menu;
		this._trigger("collapseAll");
	},

	_close: function( startMenu ) {
		if( !startMenu ) {
			startMenu = this.active ? this.active.parent() : this.menu;
		}

		startMenu
			.find( "ul" )
				.hide()
				.attr( "aria-hidden", "true" )
				.attr( "aria-expanded", "false" )
			.end()
			.find( "a.ui-state-active" )
			.removeClass( "ui-state-active" );
		
		if(startMenu == this.menu){
			startMenu.hide()
			    .attr( "aria-hidden", "true" )
			    .attr( "aria-expanded", "false" );
		}
	},

	collapse: function( event ) {
		var newItem = this.active && this.active.parents("li:not(.ui-menubar-item)").first();
		if ( newItem && newItem.length ) {
			this._close();
			this.focus( event, newItem );
			return true;
		}
	},

	expand: function( event ) {
		var newItem = this.active && this.active.children("ul").children("li").first();

		if ( newItem && newItem.length ) {
			this._open( newItem.parent() );

			//timeout so Firefox will not hide activedescendant change in expanding submenu from AT
			this._delay( function() {
				this.focus( event, newItem );
			}, 20 );
			return true;
		}
	},

	next: function(event) {
		this._move( "next", "first", event );
	},

	previous: function(event) {
		this._move( "prev", "last", event );
	},

	first: function() {
		return this.active && !this.active.prevAll( ".ui-menu-item" ).length;
	},

	last: function() {
		return this.active && !this.active.nextAll( ".ui-menu-item" ).length;
	},

	_move: function( direction, filter, event ) {
		if ( !this.active ) {
			this.focus( event, this.activeMenu.children( ".ui-menu-item" )[ filter ]() );
			return;
		}

		var next;
		if ( direction === "first" || direction === "last" ) {
			next = this.active[ direction === "first" ? "prevAll" : "nextAll" ]( ".ui-menu-item" ).eq( -1 );
		} else {
			next = this.active[ direction + "All" ]( ".ui-menu-item" ).eq( 0 );
		}

		if ( next.length ) {
			this.focus( event, next );
		} else {
			this.focus( event, this.activeMenu.children( ".ui-menu-item" )[ filter ]() );
		}
	},

	nextPage: function( event ) {
		if ( this._hasScroll() ) {
			if ( !this.active ) {
				this.focus( event, this.activeMenu.children( ".ui-menu-item" ).first() );
				return;
			}
			if ( this.last() ) {
				return;
			}

			var base = this.active.offset().top,
				height = this.menu.height(),
				result;
			this.active.nextAll( ".ui-menu-item" ).each( function() {
				result = $( this );
				return $( this ).offset().top - base - height < 0;
			});

			this.focus( event, result );
		} else {
			this.focus( event, this.activeMenu.children( ".ui-menu-item" )
				[ !this.active ? "first" : "last" ]() );
		}
	},

	previousPage: function( event ) {
		if ( this._hasScroll() ) {
			if ( !this.active ) {
				this.focus( event, this.activeMenu.children( ".ui-menu-item" ).first() );
				return;
			}
			if ( this.first() ) {
				return;
			}

			var base = this.active.offset().top,
				height = this.menu.height(),
				result;
			this.active.prevAll( ".ui-menu-item" ).each( function() {
				result = $( this );
				return $(this).offset().top - base + height > 0;
			});

			this.focus( event, result );
		} else {
			this.focus( event, this.activeMenu.children( ".ui-menu-item" ).first() );
		}
	},

	_hasScroll: function() {
		return this.menu.height() < this.menu.prop( "scrollHeight" );
	},

	_mouseleave: function( event ) {
		this.collapseAll( event );
		this.blur();
	},

	select: function( event ) {
		// save active reference before collapseAll triggers blur
		var ui = {
			item: this.active
		};
		this.collapseAll( event );
		this._trigger( "select", event, ui );
	},
	
	_bind: function( element, handlers ) {
		// no element argument, shuffle and use this.menu
		if ( !handlers ) {
			handlers = element;
			element = this.menu;
		} else {
			// accept selectors, DOM elements
			element = $( element );
			this.bindings = this.bindings.add(element);
		}

		var instance = this;
		$.each( handlers, function( event, handler ) {
			function handlerProxy() {
				// allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( instance.options.disabled === true ||
						$( this ).hasClass( "ui-state-disabled" ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}
			var match = event.match( /^(\w+)\s*(.*)$/ ),
				eventName = match[1] + "." + instance.widgetName,
				selector = match[2];
			if ( selector ) {
				instance.menu.delegate( selector, eventName, handlerProxy );
			} else {
				element.bind( eventName, handlerProxy );
			}
		});
	},
	
	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},
	
	destroy: function() {
		//destroy (sub)menus
		$(document).unbind(".menu",this.proxy);
		this.menu
			.removeAttr( "aria-activedescendant" )
			.find( "ul" )
			.andSelf()
			.removeClass( "ui-menu ui-widget ui-widget-content ui-corner-all" )
			.removeAttr( "role" )
			.removeAttr( "tabIndex" )
			.removeAttr( "aria-labelledby" )
			.removeAttr( "aria-expanded" )
			.removeAttr( "aria-hidden" )
			.show();

		//destroy menu items
		this.menu.find( ".ui-menu-item" )
			.unbind( ".menu" )
			.removeClass( "ui-menu-item" )
			.removeAttr( "role" )
			.children( "a" )
			.removeClass( "ui-corner-all ui-state-hover" )
			.removeAttr( "tabIndex" )
			.removeAttr( "role" )
			.removeAttr( "aria-haspopup" )
			.removeAttr( "id" )
			.children( ".ui-icon" )
			.remove();
		this.bindings.unbind("." + this.widgetName);
		this.menu.remove();
		this.element.unbind("." + this.widgetName).removeClass("an-menu");;
		$.Widget.prototype.destroy.apply( this, arguments );
	}
});
}( jQuery ));
