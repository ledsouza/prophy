from users import signals


def test_signals_module_has_no_old_role_global_dict():
    assert not hasattr(signals, "old_role")
