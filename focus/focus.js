$(function() {

	var o = {
		enableSelector : "td",
		groupSelector : "*[focus-group]",
		modalSelector : ".modal",
		focusClass : "focus",
		enterKey : 13,
		precision : 10
	};

	var limit = {
		left : 0,
		up : 0,
		right : 0,
		down : 0
	};

	var directions = {
		37 : "left",
		38 : "up",
		39 : "right",
		40 : "down"
	};

	function precise(val) {
		return val - val % o.precision;
	}

	var Rectangle = function(rect) {
		_.extend(this, rect);
	};

	$.fn.getRect = function() {
		var rect = this[0].getBoundingClientRect();

		var precisedRect = {
			left : precise(rect.left),
			right : precise(rect.right),
			up : precise(rect.top),
			down : precise(rect.bottom)
		};

		precisedRect.width = precisedRect.right - precisedRect.left;
		precisedRect.height = precisedRect.down - precisedRect.up;
		return new Rectangle(precisedRect);
	};

	var oldFocus = $.fn.focus;

	$.fn.focus = function() {
		if (0 == arguments.length) {
			new Focus().getFocusElement().removeClass(o.focusClass);

			var $this = $(this);
			$this.addClass(o.focusClass);
		}

		return oldFocus.apply(this, arguments);
	};

	$.fn.extend({
		isFocusable : function() {
			return $(this).is(o.enableSelector);
		}
	});

	Rectangle.prototype = {

		search : function(direction, handler) {
			var start = this[direction.getName()] / o.precision;
			var end = limit[direction.getName()] / o.precision;

			if (start < end) {
				for ( var i = start + 1; i <= end; i++) {
					console.log(1);
					if (false == handler(i * o.precision)) {
						break;
					}
				}
			} else {
				for ( var i = start - 1; i >= 0; i--) {
					console.log(1);
					if (false == handler(i * o.precision)) {
						break;
					}
				}
			}
		},

		inner : function(direction, handler) {
			var start = Math.min(this[direction.getName()], this[direction.getOppositeName()]);
			var width = Math.abs(this[direction.getName()] - this[direction.getOppositeName()]);
			var count = width / o.precision;
			for ( var i = 1; i <= count; i++) {
				console.log(1);
				if (!handler(start + i * o.precision)) {
					break;
				}
			}
		},

		outer : function(direction, handler) {
			var start = Math.min(this[direction.getName()], this[direction.getOppositeName()]);
			var width = Math.abs(this[direction.getName()] - this[direction.getOppositeName()]);
			var count = width / o.precision;
			for ( var i = 1; i <= count; i++) {
				console.log(1);
				if (!handler(start + i * o.precision)) {
					break;
				}
			}
		}
	};

	var Direction = function(keyCode) {
		this._keyCode = keyCode;
	};

	Direction.prototype = {
		getName : function() {
			return directions[this._keyCode];
		},

		getOppositeName : function() {
			return this.getOppositeDirection().getName();
		},

		getRotateName : function() {
			return this.getRotateDirection().getName();
		},

		getOppositeDirection : function() {
			return new Direction(37 + (this._keyCode + 1) % 4);
		},

		getRotateDirection : function() {
			return new Direction(this._keyCode + (0 == this._keyCode % 2 ? -1 : 1));
		}
	};

	var Focus = function() {
		var $modalEl = $(o.modalSelector).filter(":visible");
		if ($modalEl.length > 0) {
			this.$el = $modalEl;
		} else {
			this.$el = $(document);
		}
	};

	Focus.prototype = {
		enter : function() {
			this.getFocusElement().click();
		},

		getFocusElement : function() {
			return this.$el.find("." + o.focusClass + ":visible");
		},

		move : function(direction) {
			var $focus = this.getFocusElement().first();
			var focusRect = $focus.getRect();
			var rotateDirection = direction.getRotateDirection();

			var nextElementArr = [];

			var isX = _.include([ "left", "right" ], rotateDirection.getName());

			var isFind = false;
			focusRect.search(direction, function(b) {
				focusRect.inner(rotateDirection, function(a) {
					var x, y;
					if (isX) {
						x = a;
						y = b;
					} else {
						x = b;
						y = a;
					}

					var element = document.elementFromPoint(x, y);
					if (element && $(element).isFocusable()) {
						nextElementArr.push(element);
						isFind = true;
					}

					if (isFind) {
						return false;
					}
				});

				return !isFind;
			});

			nextElementArr = _.uniq(nextElementArr);

			if (!_.isEmpty(nextElementArr)) {
				var $next = $(nextElementArr[0]);
				$next.focus();
			}
		}
	};

	$(document).on("keyup", function(e) {
		var keyCode = e.keyCode;

		$(o.modalSelector).filter(":visible");

		if (keyCode in directions) {
			new Focus().move(new Direction(keyCode));
		} else if (o.enterKey == keyCode) {
			new Focus().enter();
		}
	});

	window.Focus = {
		start : function(options) {
			_.extend(o, options);
			limit.right = precise(screen.width);
			limit.down = precise(screen.height);
		}
	};
});