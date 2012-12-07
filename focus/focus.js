$(function() {

	var o = {
		enableSelector : "td",
		groupSelector : "*[focus-group]",
		modalSelector : ".modal",
		focusClass : "focus",
		enterKey : 13,
		precision : 20
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
		var rect = this.getBoundingClientRect();

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

	Rectangle.prototype = {
		scan : function(handler, direction) {
			if (direction.isAscend()) {
				var count = (limit[direction.getOppositeName()] - this[direction.getName()]) / o.precision;
				for ( var i = 0; i < count; i++) {
					if (false == handler(i)) {
						break;
					}
				}
			} else {
				var count = limit[direction.getOppositeName()] / o.precision;
				for ( var i = count - 1; i >= 0; i++) {
					if (false == handler(i)) {
						break;
					}
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
			return new Direction(37 + (this._keyCode - 37 + 1) % 4);
		},

		getRotateDirection : function() {
			return new Direction(37 + (this._keyCode - 37 - 1) % 4);
		},

		isAscend : function() {
			return _.include([ "right", "down" ], this.getName());
		},

		isX : function() {
			return _
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
			var $focus = getFocusElement().first();
			var rect = $focus.getRect();

			var rotateDirection = direction.getRotateDirection();

			rect.scan(function(i) {
				rotateDirection.each(function(j) {
				}, direction);
			});

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
			limit.height = precise(screen.width);
		}
	};
});