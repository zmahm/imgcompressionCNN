"""Unit tests for the model loader."""
import pytest
import torch

from app.model import get_model


class TestGetModel:
    def test_loads_quality_1(self):
        model = get_model(1)
        assert model is not None

    def test_returns_same_instance_on_repeated_calls(self):
        m1 = get_model(1)
        m2 = get_model(1)
        assert m1 is m2

    def test_model_in_eval_mode(self):
        model = get_model(1)
        assert not model.training

    def test_invalid_quality_raises(self):
        with pytest.raises(ValueError):
            get_model(0)
        with pytest.raises(ValueError):
            get_model(9)

    def test_model_has_encoder_decoder(self):
        model = get_model(1)
        assert hasattr(model, "g_a")  # encoder
        assert hasattr(model, "g_s")  # decoder
        assert hasattr(model, "compress")
        assert hasattr(model, "decompress")

    def test_forward_pass_shape(self):
        model = get_model(1)
        x = torch.zeros(1, 3, 64, 64)
        with torch.no_grad():
            y = model.g_a(x)
        assert y.shape[0] == 1
        assert y.shape[1] > 0
        # Spatial dimensions should be smaller than input
        assert y.shape[2] < 64
        assert y.shape[3] < 64
