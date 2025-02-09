import numpy as np
from shiny import reactive
from shiny.express import input, render, ui
from shinywidgets import render_widget

from pixiplex import Pixinet, load_les_miserables

node_ids, edgelist = load_les_miserables()


ui.input_action_button("update_node_color", "Update node color")
ui.input_action_button("update_value", "Update value")


@render_widget
def force_net():
	p = Pixinet(node_ids, edgelist, width=350, height=350)
	print(id(p))
	return p


@reactive.effect
def change_node_color():
	input.update_node_color()  # dependency injection
	print(f"{input.update_node_color()}")
	print(type(force_net.widget))
	print(id(force_net.widget))
	force_net.widget.node_color = ["0xff0000"] * len(node_ids)
	# force_net.node_color = ["0xff0000"] * len(node_ids)


@reactive.effect
def increment_value():
	input.update_value()  # dependency injection
	force_net.widget.node_value += 1
