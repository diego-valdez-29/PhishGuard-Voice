try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    nn = None
    torch = None

if TORCH_AVAILABLE:
    class SyntheticVoiceMLP(nn.Module):
        def __init__(self, input_dim: int = 768, hidden_dim: int = 256, num_classes: int = 2):
            super().__init__()
            self.net = nn.Sequential(
                nn.Linear(input_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(hidden_dim, num_classes)
            )

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            return self.net(x)
else:
    class SyntheticVoiceMLP:
        """CPU fallback stub when PyTorch is not compiled in current runtime"""
        def __init__(self, input_dim: int = 768, hidden_dim: int = 256, num_classes: int = 2):
            self.input_dim = input_dim
            self.hidden_dim = hidden_dim
            self.num_classes = num_classes

        def forward(self, x):
            return x
