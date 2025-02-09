from traitlets import HasTraits, List, observe


class TraitletsExample(HasTraits):
	values = List(default_value=[0, 0, 0, 0]).tag(config=True)

	@observe("values")
	def _values_changed(self, change):
		print("{name} changed from {old} to {new}".format(**change))


t = TraitletsExample()
t.values = [0, 1, 2, 3]  # works
t.values[:] = [0, 1, 2, 4]  # doesnt work
